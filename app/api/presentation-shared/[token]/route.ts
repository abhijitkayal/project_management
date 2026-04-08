import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Database from "@/lib/models/Database";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  await connectDB();

  try {
    const { token } = await params;

    const database = await Database.findOne({
      viewType: "presentation",
      "shareLinks.token": token,
    }).select("_id name icon projectId shareLinks");

    if (!database) {
      return NextResponse.json(
        { error: "Invalid or expired share link" },
        { status: 404 }
      );
    }

    const shareLink = (database.shareLinks || []).find((link: any) => link.token === token);

    if (!shareLink) {
      return NextResponse.json(
        { error: "Share link not found" },
        { status: 404 }
      );
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Share link has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      presentation: {
        _id: database._id,
        name: database.name,
        icon: database.icon,
        projectId: database.projectId,
      },
      permission: shareLink.permission === "edit" ? "edit" : "view",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to access shared presentation" },
      { status: 500 }
    );
  }
}
