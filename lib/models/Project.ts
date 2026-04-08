// lib/models/Project.ts  (or app/models/Project.ts — match your existing import path)
import mongoose, { Schema, models, model } from "mongoose";

const ProjectSchema = new Schema(
  {
    ownerId:  { type: String, index: true },
    ownerEmail: { type: String, default: "" },
    name:     { type: String, required: true },
    emoji:    { type: String, default: "📁" },

    /* ── New fields for Kanban board ── */
    status: {
      type:    String,
      enum:    ["Not started", "In progress", "Done"],
      default: "Not started",
    },
    priority: {
      type:    String,
      enum:    ["Low", "Medium", "High"],
      default: "Medium",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },

    /* optional extras */
    description: { type: String, default: "" },
    dueDate:     { type: Date,   default: null },

    // Share links used by /api/projects/[id]/share and /api/shared/[token]
    shareLinks: [
      {
        token: { type: String, required: true, index: true },
        permission: { type: String, enum: ["view", "edit"], default: "view" },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: null },
      },
    ],

    // Email-based collaborators used by invite flows in Share modal
    collaborators: [
      {
        email: { type: String, required: true },
        role: { type: String, enum: ["viewer", "commenter", "editor"], default: "viewer" },
        status: { type: String, enum: ["pending", "accepted"], default: "pending" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // Pending requests that must be accepted before collaboration access is granted.
    collaborationRequests: [
      {
        email: { type: String, required: true },
        role: { type: String, enum: ["viewer", "commenter", "editor"], default: "viewer" },
        status: { type: String, enum: ["pending"], default: "pending" },
        requestedAt: { type: Date, default: Date.now },
        invitedBy: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
  delete mongoose.models.Project;
}

export default models.Project || model("Project", ProjectSchema);