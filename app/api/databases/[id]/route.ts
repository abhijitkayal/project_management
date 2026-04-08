import { NextResponse } from "next/server";
import connectDB from "../../../../lib/dbConnect";
import Database from "../../../../lib/models/Database";
import { getAuthUser } from "../../../../lib/authUser";
import { getCollaboratorPermissionForProject } from "../../../../lib/collaboratorAccess";
import {
  getSharePermissionForProject,
  getShareTokenFromRequest,
  hasRequiredPermission,
} from "../../../../lib/shareAccess";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const authUser = await getAuthUser();

  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deletedDatabase = await Database.findOneAndDelete({ _id: id, userId: authUser.userId, ownerId: authUser.userId });

    if (!deletedDatabase) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const authUser = await getAuthUser();

  const { id } = await params;
  const body = await req.json();

  try {
    const existing = await Database.findById(id).select("_id projectId ownerId userId");

    if (!existing) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    let canEdit = false;
    const ownerUserId = String(existing.ownerId || existing.userId || "");

    if (authUser?.userId) {
      if (ownerUserId === authUser.userId) {
        canEdit = true;
      } else {
        const collaboratorPermission = await getCollaboratorPermissionForProject(
          String(existing.projectId),
          authUser.email
        );
        if (collaboratorPermission && hasRequiredPermission(collaboratorPermission, "edit")) {
          canEdit = true;
        }
      }
    }

    if (!canEdit) {
      const shareToken = getShareTokenFromRequest(req);
      if (shareToken) {
        const sharePermission = await getSharePermissionForProject(
          String(existing.projectId),
          shareToken
        );
        if (sharePermission && hasRequiredPermission(sharePermission, "edit")) {
          canEdit = true;
        }
      }
    }

    if (!canEdit) {
      return NextResponse.json(
        { error: authUser?.userId ? "Forbidden" : "Unauthorized" },
        { status: authUser?.userId ? 403 : 401 }
      );
    }

    const updatePatch: Record<string, unknown> = {};
    if (typeof body.name === "string") {
      updatePatch.name = body.name;
    }
    if (typeof body.icon === "string") {
      updatePatch.icon = body.icon;
    }

    if (Object.keys(updatePatch).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await Database.findByIdAndUpdate(
      id,
      { $set: updatePatch },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}

