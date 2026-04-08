import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";
import nodemailer from "nodemailer";

type Role = "viewer" | "commenter" | "editor";

async function sendCollaboratorInviteEmail(params: {
  to: string;
  role: Role;
  projectName: string;
  inviterEmail?: string;
}) {
  const user = process.env.EMAIL_USER || process.env.EMAIL;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return { success: false, reason: "email_not_configured" as const };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Workspace Collaboration" <${user}>`,
    to: params.to,
    subject: `Invitation to collaborate on ${params.projectName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
        <h2 style="margin:0 0 8px;">You are invited to collaborate</h2>
        <p style="margin:0 0 12px;">You were invited to join <strong>${params.projectName}</strong> as a <strong>${params.role}</strong>.</p>
        <p style="margin:0 0 12px;">Invited by: ${params.inviterEmail || "Project owner"}</p>
        <p style="margin:0;">Open the app and check your shared projects/collaborations list.</p>
      </div>
    `,
    text: `You were invited to collaborate on ${params.projectName} as a ${params.role}. Invited by: ${params.inviterEmail || "Project owner"}.`,
  });

  return { success: true };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authEmail = String(authUser.email || "").trim().toLowerCase();

  const project = await Project.findOne({ _id: id }).select("ownerId collaborators collaborationRequests");
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const isOwner = String(project.ownerId) === String(authUser.userId);
  const isCollaborator = Array.isArray(project.collaborators)
    ? project.collaborators.some(
        (c: any) =>
          String(c.email || "").toLowerCase() === authEmail &&
          String(c.status || "accepted").toLowerCase() === "accepted"
      )
    : false;

  if (!isOwner && !isCollaborator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const acceptedCollaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
  const pendingRequests = Array.isArray((project as any).collaborationRequests)
    ? (project as any).collaborationRequests.map((r: any) => ({
        email: r.email,
        role: r.role,
        status: "pending",
        addedAt: r.requestedAt || r.addedAt || new Date(),
      }))
    : [];

  return NextResponse.json({
    success: true,
    collaborators: [...acceptedCollaborators, ...pendingRequests],
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "viewer") as Role;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!["viewer", "commenter", "editor"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const project = await Project.findOne({ _id: id, ownerId: authUser.userId });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
  const collaborationRequests = Array.isArray((project as any).collaborationRequests)
    ? (project as any).collaborationRequests
    : [];

  const existingCollaborator = collaborators.find(
    (c: any) =>
      String(c.email || "").toLowerCase() === email &&
      String(c.status || "accepted").toLowerCase() === "accepted"
  );
  const existingRequest = collaborationRequests.find(
    (r: any) => String(r.email || "").toLowerCase() === email
  );

  if (existingCollaborator) {
    existingCollaborator.role = role;
  } else if (existingRequest) {
    existingRequest.role = role;
    existingRequest.status = "pending";
    existingRequest.requestedAt = new Date();
    existingRequest.invitedBy = String(authUser.email || "").trim().toLowerCase();
  } else {
    collaborationRequests.push({
      email,
      role,
      status: "pending",
      requestedAt: new Date(),
      invitedBy: String(authUser.email || "").trim().toLowerCase(),
    });
  }

  project.collaborators = collaborators;
  (project as any).collaborationRequests = collaborationRequests;
  await project.save();

  let emailSent = false;
  try {
    const result = await sendCollaboratorInviteEmail({
      to: email,
      role,
      projectName: String(project.name || "Untitled Project"),
      inviterEmail: authUser.email,
    });
    emailSent = result.success;
    if (!result.success) {
      console.warn("Collaborator invite email skipped:", result.reason);
    }
  } catch (error) {
    console.error("Failed to send collaborator invite email:", error);
  }

  const pendingRequests = collaborationRequests.map((r: any) => ({
    email: r.email,
    role: r.role,
    status: "pending",
    addedAt: r.requestedAt || new Date(),
  }));

  return NextResponse.json({
    success: true,
    collaborators: [...(project.collaborators || []), ...pendingRequests],
    emailSent,
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, ownerId: authUser.userId },
    {
      $pull: {
        collaborators: { email },
        collaborationRequests: { email },
      },
    },
    { new: true }
  ).select("collaborators collaborationRequests");

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const pendingRequests = Array.isArray((project as any).collaborationRequests)
    ? (project as any).collaborationRequests.map((r: any) => ({
        email: r.email,
        role: r.role,
        status: "pending",
        addedAt: r.requestedAt || new Date(),
      }))
    : [];

  return NextResponse.json({
    success: true,
    collaborators: [...(project.collaborators || []), ...pendingRequests],
  });
}
