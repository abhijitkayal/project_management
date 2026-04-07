import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/GalleryItem";
import Database from "@/lib/models/Database";
import DatabaseProperty from "@/lib/models/DatabaseProperty";
import { getAuthUser } from "@/lib/authUser";
import nodemailer from "nodemailer";
import { getSharePermissionForProject, getShareTokenFromRequest, hasRequiredPermission } from "@/lib/shareAccess";
import { getCollaboratorPermissionForProject } from "@/lib/collaboratorAccess";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sendAssignmentEmail(to: string, title: string, fieldName: string) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to,
    subject: "Task assigned to you",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">New task assignment</h2>
        <p>You were assigned via <b>${fieldName}</b>.</p>
        <p><b>Task:</b> ${title || "Untitled"}</p>
      </div>
    `,
  });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const item = await DatabaseItem.findById(id).select("_id databaseId title values");
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const database = await Database.findById(item.databaseId).select("_id ownerId projectId");
  if (!database) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (authUser?.userId) {
    if (String(database.ownerId) !== authUser.userId) {
      const collaboratorPermission = await getCollaboratorPermissionForProject(String(database.projectId), authUser.email);
      if (!collaboratorPermission || !hasRequiredPermission(collaboratorPermission, "edit")) {
        const shareToken = getShareTokenFromRequest(req);
        if (!shareToken) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const permission = await getSharePermissionForProject(String(database.projectId), shareToken);
        if (!permission || !hasRequiredPermission(permission, "edit")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }
  } else {
    const shareToken = getShareTokenFromRequest(req);
    if (!shareToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = await getSharePermissionForProject(String(database.projectId), shareToken);
    if (!permission || !hasRequiredPermission(permission, "edit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const setPayload: Record<string, unknown> = {};
  const previousValues = (item.values || {}) as Record<string, unknown>;

  if (body?.title !== undefined) {
    setPayload.title = body.title;
  }

  if (body?.values && typeof body.values === "object") {
    Object.entries(body.values as Record<string, unknown>).forEach(([key, value]) => {
      setPayload[`values.${key}`] = value;
    });
  }

  if (!Object.keys(setPayload).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const changedFieldIds = body?.values && typeof body.values === "object"
    ? Object.keys(body.values as Record<string, unknown>)
    : [];

  if (changedFieldIds.length) {
    const properties = await DatabaseProperty.find({
      _id: { $in: changedFieldIds },
    }).select("_id name type");

    const propertyMap = new Map(
      properties.map((p) => [p._id.toString(), { name: String(p.name || ""), type: String(p.type || "") }])
    );

    await Promise.allSettled(
      changedFieldIds.map(async (fieldId) => {
        const meta = propertyMap.get(fieldId);
        if (!meta) return;

        const isAssignmentField = meta.type === "email" || /assign|assignee|owner|email/i.test(meta.name);
        if (!isAssignmentField) return;

        const oldValue = String(previousValues[fieldId] ?? "").trim().toLowerCase();
        const nextRaw = (body.values as Record<string, unknown>)[fieldId];
        const newValue = String(nextRaw ?? "").trim().toLowerCase();

        if (!newValue || oldValue === newValue || !isValidEmail(newValue)) return;

        await sendAssignmentEmail(newValue, String(body?.title ?? item.title ?? "Untitled"), meta.name);
      })
    );
  }

  const updated = await DatabaseItem.findByIdAndUpdate(
    id,
    { $set: setPayload },
    { new: true, runValidators: false }
  );

  if (!updated) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Sign in required for editing" }, { status: 401 });
  }

  const { id } = await context.params;
  const item = await DatabaseItem.findById(id).select("_id databaseId");
  if (!item) {
    return NextResponse.json({ success: true });
  }

  const database = await Database.findById(item.databaseId).select("_id ownerId projectId");
  if (!database) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (String(database.ownerId) !== authUser.userId) {
    const collaboratorPermission = await getCollaboratorPermissionForProject(String(database.projectId), authUser.email);
    if (!collaboratorPermission || !hasRequiredPermission(collaboratorPermission, "edit")) {
      const shareToken = getShareTokenFromRequest(req);
      if (!shareToken) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const permission = await getSharePermissionForProject(String(database.projectId), shareToken);
      if (!permission || !hasRequiredPermission(permission, "edit")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  await DatabaseItem.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
