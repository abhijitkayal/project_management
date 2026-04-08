import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

type RequestAction = "accept" | "reject";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authEmail = String(authUser.email || "").trim().toLowerCase();
  if (!authEmail) {
    return NextResponse.json({ error: "Authenticated email is required" }, { status: 400 });
  }

  const body = await req.json();
  const action = String(body?.action || "").toLowerCase() as RequestAction;
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const project = await Project.findOne({ _id: id }).select(
    "name collaborationRequests collaborators"
  );
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const requests = Array.isArray((project as any).collaborationRequests)
    ? (project as any).collaborationRequests
    : [];
  const requestIndex = requests.findIndex(
    (r: any) =>
      String(r?.email || "").trim().toLowerCase() === authEmail &&
      String(r?.status || "pending").toLowerCase() === "pending"
  );

  if (requestIndex === -1) {
    return NextResponse.json({ error: "No pending collaboration request found" }, { status: 404 });
  }

  const request = requests[requestIndex];

  if (action === "accept") {
    const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
    const existing = collaborators.find(
      (c: any) => String(c?.email || "").trim().toLowerCase() === authEmail
    );

    if (existing) {
      existing.role = request.role;
      existing.status = "accepted";
      existing.addedAt = existing.addedAt || new Date();
    } else {
      collaborators.push({
        email: authEmail,
        role: request.role,
        status: "accepted",
        addedAt: new Date(),
      });
    }

    project.collaborators = collaborators;
  }

  requests.splice(requestIndex, 1);
  (project as any).collaborationRequests = requests;
  await project.save();

  return NextResponse.json({
    success: true,
    action,
    projectId: String((project as any)._id),
    projectName: String((project as any).name || "Untitled"),
  });
}
