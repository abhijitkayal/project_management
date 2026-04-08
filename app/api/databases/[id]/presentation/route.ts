import { NextResponse } from "next/server";
import dbConnect from "../../../../../lib/dbConnect";
import Database from "../../../../../lib/models/Database";
import { getAuthUser } from "../../../../../lib/authUser";
import { getCollaboratorPermissionForProject } from "../../../../../lib/collaboratorAccess";
import {
  getSharePermissionForProject,
  getShareTokenFromRequest,
  hasRequiredPermission,
} from "../../../../../lib/shareAccess";
import {
  getPresentationShareTokenFromRequest,
  getSharePermissionForPresentation,
  hasRequiredPresentationPermission,
} from "../../../../../lib/presentationShareAccess";

async function hasDatabasePermission(req: Request, id: string, required: "view" | "edit") {
  const authUser = await getAuthUser();
  const existing = await Database.findById(id).select("_id ownerId userId projectId viewType");

  if (!existing || String(existing.viewType) !== "presentation") {
    return { ok: false, status: 404, reason: "Presentation not found" };
  }

  const ownerUserId = String(existing.ownerId || existing.userId || "");
  let actualPermission: "view" | "edit" | null = null;

  if (authUser?.userId && ownerUserId === authUser.userId) {
    actualPermission = "edit";
  }

  if (!actualPermission && authUser?.email) {
    const collaboratorPermission = await getCollaboratorPermissionForProject(
      String(existing.projectId),
      authUser.email
    );
    if (collaboratorPermission) {
      actualPermission = collaboratorPermission;
    }
  }

  if (!actualPermission) {
    const projectShareToken = getShareTokenFromRequest(req);
    if (projectShareToken) {
      const projectSharePermission = await getSharePermissionForProject(
        String(existing.projectId),
        projectShareToken
      );
      if (projectSharePermission) {
        actualPermission = projectSharePermission;
      }
    }
  }

  if (!actualPermission) {
    const presentationShareToken = getPresentationShareTokenFromRequest(req);
    if (presentationShareToken) {
      const presentationSharePermission = await getSharePermissionForPresentation(
        String(existing._id),
        presentationShareToken
      );
      if (presentationSharePermission) {
        actualPermission = presentationSharePermission;
      }
    }
  }

  if (!actualPermission) {
    return {
      ok: false,
      status: authUser?.userId ? 403 : 401,
      reason: authUser?.userId ? "Forbidden" : "Unauthorized",
    };
  }

  const allowed = hasRequiredPermission(actualPermission, required)
    || hasRequiredPresentationPermission(actualPermission, required);
  if (!allowed) {
    return { ok: false, status: 403, reason: "Forbidden" };
  }

  return { ok: true, status: 200, reason: "ok" };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const permissionCheck = await hasDatabasePermission(req, id, "view");
    if (!permissionCheck.ok) {
      return NextResponse.json({ error: permissionCheck.reason }, { status: permissionCheck.status });
    }

    const db = await Database.findById(id).select("presentationData");
    // Return an empty array if no presentation data exists so the frontend can use starter slides
    return NextResponse.json({ slides: db?.presentationData ?? [] });
  } catch (err: any) {
    console.error("[API] presentation GET error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const permissionCheck = await hasDatabasePermission(req, id, "edit");
    if (!permissionCheck.ok) {
      return NextResponse.json({ error: permissionCheck.reason }, { status: permissionCheck.status });
    }

    const body = await req.json();
    // Upsert so the database doc is created if it doesn't exist
    await Database.findByIdAndUpdate(
      id,
      { $set: { presentationData: body.slides, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API] presentation POST error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
