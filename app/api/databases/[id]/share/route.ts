import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Database from "@/lib/models/Database";
import { getAuthUser } from "@/lib/authUser";
import crypto from "crypto";

const ALLOWED_VIEW_TYPES = ["whiteboard", "video", "socialmedia"];

export async function POST(
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
    const { permission } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Database ID required" }, { status: 400 });
    }

    if (!["view", "edit"].includes(permission)) {
      return NextResponse.json({ error: "Invalid permission type" }, { status: 400 });
    }

    const database = await Database.findOne({ _id: id, ownerId: authUser.userId }).select("viewType");
    if (!database) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (!ALLOWED_VIEW_TYPES.includes(String(database.viewType))) {
      return NextResponse.json({ error: "Sharing is not enabled for this resource" }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString("hex");

    await Database.findByIdAndUpdate(id, {
      $push: {
        shareLinks: {
          token,
          permission,
          createdAt: new Date(),
          expiresAt: null,
        },
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const sharedBasePath =
      database.viewType === "whiteboard"
        ? "/whiteboard/shared"
        : database.viewType === "video"
          ? "/video-editing/shared"
          : "/socialmedia/shared";

    const shareUrl = `${baseUrl}${sharedBasePath}/${token}`;

    return NextResponse.json({
      success: true,
      token,
      shareUrl,
      permission,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function GET(
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

    const database = await Database.findOne({ _id: id, ownerId: authUser.userId }).select("viewType shareLinks");
    if (!database) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (!ALLOWED_VIEW_TYPES.includes(String(database.viewType))) {
      return NextResponse.json({ error: "Sharing is not enabled for this resource" }, { status: 400 });
    }

    return NextResponse.json({ success: true, shareLinks: database.shareLinks || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch share links" }, { status: 500 });
  }
}

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
    const { token } = await req.json();

    const database = await Database.findOneAndUpdate(
      { _id: id, ownerId: authUser.userId, viewType: { $in: ALLOWED_VIEW_TYPES } },
      { $pull: { shareLinks: { token } } },
      { new: true }
    );

    if (!database) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Share link deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete share link" }, { status: 500 });
  }
}
