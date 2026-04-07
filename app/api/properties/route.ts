// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import DatabaseProperty from "@/lib/models/GalleryProperty";

// export async function GET(req: Request) {
//   await connectDB();

//   const { searchParams } = new URL(req.url);
//   const databaseId = searchParams.get("databaseId");

//   if (!databaseId) {
//     return NextResponse.json({ message: "databaseId missing" }, { status: 400 });
//   }

//   const properties = await DatabaseProperty.find({ databaseId }).sort({
//     createdAt: 1,
//   });

//   return NextResponse.json(properties);
// }

// export async function POST(req: Request) {
//   await connectDB();
//   const body = await req.json();

//   const created = await DatabaseProperty.create(body);
//   return NextResponse.json(created);
// }


import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import DatabaseProperty from "@/lib/models/DatabaseProperty";
import Database from "@/lib/models/Database";
import { getAuthUser } from "@/lib/authUser";
import { getSharePermissionForProject, getShareTokenFromRequest, hasRequiredPermission } from "@/lib/shareAccess";
import { getCollaboratorPermissionForProject } from "@/lib/collaboratorAccess";

export async function GET(req: Request) {
  await connectDB();
  const authUser = await getAuthUser();

  const { searchParams } = new URL(req.url);
  const databaseId = searchParams.get("databaseId");

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

  const props = await DatabaseProperty.find({ databaseId }).sort({
    createdAt: 1,
  });

  return NextResponse.json(props);
}

export async function POST(req: Request) {
  await connectDB();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ message: "Sign in required for editing" }, { status: 401 });
  }
  const body = await req.json();

  console.log("📝 Creating property with body:", body);

  if (!body.databaseId || !body.name || !body.type) {
    return NextResponse.json(
      { message: "databaseId, name, type required" },
      { status: 400 }
    );
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

  try {
    const created = await DatabaseProperty.create({
      databaseId: body.databaseId,
      name: body.name,
      type: body.type,
      options: body.options || [],
      formula: body.formula || "",
    });

    console.log("✅ Created property:", created);
    return NextResponse.json(created);
  } catch (error) {
    console.error("❌ Error creating property:", error);
    return NextResponse.json(
      { message: "Failed to create property", error: String(error) },
      { status: 500 }
    );
  }
}
