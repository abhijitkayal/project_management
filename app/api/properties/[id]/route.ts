// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import DatabaseProperty from "@/lib/models/GalleryProperty";

// export async function PATCH(
//   req: Request,
//   context: { params: Promise<{ id: string }> }
// ) {
//   await connectDB();
//   const { id } = await context.params;
//   const body = await req.json();

//   const updated = await DatabaseProperty.findByIdAndUpdate(
//     id,
//     { $set: body },
//     { new: true }
//   );

//   return NextResponse.json(updated);
// }

// export async function DELETE(
//   req: Request,
//   context: { params: Promise<{ id: string }> }
// ) {
//   await connectDB();
//   const { id } = await context.params;
//   await DatabaseProperty.findByIdAndDelete(id);

//   return NextResponse.json({ success: true });
// }



import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseProperty from "@/lib/models/DatabaseProperty";
import Database from "@/lib/models/Database";
import { getAuthUser } from "@/lib/authUser";
import { getSharePermissionForProject, getShareTokenFromRequest, hasRequiredPermission } from "@/lib/shareAccess";
import { getCollaboratorPermissionForProject } from "@/lib/collaboratorAccess";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Sign in required for editing" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const prop = await DatabaseProperty.findById(id).select("_id databaseId");
  if (!prop) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const database = await Database.findById(prop.databaseId).select("_id ownerId projectId");
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

  const updated = await DatabaseProperty.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

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

  const prop = await DatabaseProperty.findById(id).select("_id databaseId");
  if (!prop) {
    return NextResponse.json({ success: true });
  }

  const database = await Database.findById(prop.databaseId).select("_id ownerId projectId");
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

  await DatabaseProperty.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
