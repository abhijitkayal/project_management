import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/lib/models/Project";
import { getAuthUser } from "@/lib/authUser";

export async function GET() {
  await dbConnect();

  const authUser = await getAuthUser();
  if (!authUser?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authEmail = String(authUser.email || "").trim().toLowerCase();
  if (!authEmail) {
    return NextResponse.json([]);
  }

  const projects = await Project.find({
    ownerId: { $ne: authUser.userId },
    collaborationRequests: {
      $elemMatch: {
        email: authEmail,
        status: "pending",
      },
    },
  }).select("name emoji ownerId ownerEmail collaborationRequests");

  const requests = projects
    .map((project: any) => {
      const req = Array.isArray(project.collaborationRequests)
        ? project.collaborationRequests.find(
            (r: any) =>
              String(r?.email || "").trim().toLowerCase() === authEmail &&
              String(r?.status || "").toLowerCase() === "pending"
          )
        : null;

      if (!req) return null;

      return {
        projectId: String(project._id),
        projectName: String(project.name || "Untitled"),
        projectEmoji: String(project.emoji || "📁"),
        role: String(req.role || "viewer"),
        status: "pending",
        requestedAt: req.requestedAt || null,
        invitedBy: String(req.invitedBy || project.ownerEmail || ""),
      };
    })
    .filter(Boolean);

  return NextResponse.json(requests);
}
