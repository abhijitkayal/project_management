// app/api/projects/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

/* ── GET /api/projects ── */
export async function GET() {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authEmail = String(authUser.email || "").trim().toLowerCase();

  const projects = await Project.find({
    $or: [
      { ownerId: authUser.userId },
      authEmail
        ? {
            collaborators: {
              $elemMatch: {
                email: authEmail,
                status: "accepted",
              },
            },
          }
        : { _id: null },
    ],
  }).sort({ createdAt: -1 });

  return NextResponse.json(projects);
}

/* ── POST /api/projects ── */
export async function POST(req: Request) {
  await dbConnect();
  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const project = await Project.create({
    ownerId:     authUser.userId,
    ownerEmail:  authUser.email || "",
    name:        body.name,
    emoji:       body.emoji       || "📁",
    status:      body.status      || "Not started",
    priority:    body.priority    || "Medium",
    progress:    body.progress    ?? 0,
    description: body.description || "",
    dueDate:     body.dueDate     || null,
  });

  return NextResponse.json(project);
}

/* ── DELETE /api/projects?id=xxx ── */
export async function DELETE(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await Project.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}