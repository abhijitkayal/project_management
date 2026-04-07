import Project from "@/lib/models/Project";

export type CollaboratorPermission = "view" | "edit";

function normalizeEmail(email?: string | null) {
  return String(email || "").trim().toLowerCase();
}

export async function getCollaboratorPermissionForProject(
  projectId: string,
  email?: string | null
): Promise<CollaboratorPermission | null> {
  const authEmail = normalizeEmail(email);
  if (!authEmail) return null;

  const project = await Project.findOne({
    _id: projectId,
    collaborators: { $elemMatch: { email: authEmail } },
  }).select("collaborators");

  if (!project || !Array.isArray(project.collaborators)) {
    return null;
  }

  const collaborator = project.collaborators.find(
    (c: any) => normalizeEmail(c?.email) === authEmail
  );

  if (!collaborator) return null;

  const status = String(collaborator.status || "").toLowerCase();
  const role = String(collaborator.role || "viewer").toLowerCase();

  // Pending invite can view, accepted editor can edit.
  if (status !== "accepted" && status !== "pending") {
    return null;
  }

  if (role === "editor" && status === "accepted") {
    return "edit";
  }

  return "view";
}
