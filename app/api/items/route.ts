import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseItem from "@/lib/models/GalleryItem";
import Database from "@/lib/models/Database";
import DatabaseProperty from "@/lib/models/DatabaseProperty";
import { getAuthUser } from "@/lib/authUser";
import { getSharePermissionForProject, getShareTokenFromRequest, hasRequiredPermission } from "@/lib/shareAccess";
import { getCollaboratorPermissionForProject } from "@/lib/collaboratorAccess";

export async function GET(req: Request) {
  await connectDB();
  const authUser = await getAuthUser();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");
  const mode = searchParams.get("mode");

  if (!databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const database = await Database.findById(databaseId).select("_id ownerId projectId");
  if (!database) {
    return NextResponse.json([], { status: 200 });
  }

  if (authUser?.userId) {
    if (String(database.ownerId) !== authUser.userId) {
      const collaboratorPermission = await getCollaboratorPermissionForProject(String(database.projectId), authUser.email);
      if (collaboratorPermission && hasRequiredPermission(collaboratorPermission, "view")) {
        // Collaborator has direct project access.
      } else {
      const shareToken = getShareTokenFromRequest(req);
      if (!shareToken) {
        return NextResponse.json([], { status: 200 });
      }

      const permission = await getSharePermissionForProject(String(database.projectId), shareToken);
      if (!permission || !hasRequiredPermission(permission, "view")) {
        return NextResponse.json([], { status: 200 });
      }
      }
    }
  } else {
    const shareToken = getShareTokenFromRequest(req);
    if (!shareToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const permission = await getSharePermissionForProject(String(database.projectId), shareToken);
    if (!permission || !hasRequiredPermission(permission, "view")) {
      return NextResponse.json([], { status: 200 });
    }
  }

  const query: Record<string, unknown> = { databaseId };

  if (mode === "assigned" && authUser?.email) {
    const emailProps = await DatabaseProperty.find({
      databaseId,
      type: "email",
    }).select("_id");

    const emailMatches = emailProps.map((p) => ({
      [`values.${p._id.toString()}`]: authUser.email,
    }));

    if (!emailMatches.length) {
      return NextResponse.json([], { status: 200 });
    }

    query.$or = emailMatches;
  }

  const items = await DatabaseItem.find(query).sort({ createdAt: 1 });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ message: "Sign in required for editing" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.databaseId) {
    return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
  }

  const database = await Database.findById(body.databaseId).select("_id ownerId projectId");
  if (!database) {
    return NextResponse.json({ message: "Database not found" }, { status: 404 });
  }

  if (String(database.ownerId) !== authUser.userId) {
    const collaboratorPermission = await getCollaboratorPermissionForProject(String(database.projectId), authUser.email);
    if (!collaboratorPermission || !hasRequiredPermission(collaboratorPermission, "edit")) {
      const shareToken = getShareTokenFromRequest(req);
      if (!shareToken) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const permission = await getSharePermissionForProject(String(database.projectId), shareToken);
      if (!permission || !hasRequiredPermission(permission, "edit")) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }
  }

  const values = body.values && typeof body.values === "object" ? body.values : {};

  const created = await DatabaseItem.create({
    databaseId: body.databaseId,
    title: body.title || (typeof values.title === "string" ? values.title : "Untitled"),
    values,
  });

  return NextResponse.json(created);
}