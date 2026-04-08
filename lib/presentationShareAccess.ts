import Database from "@/lib/models/Database";

export type PresentationSharePermission = "view" | "edit";

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function getPresentationShareTokenFromRequest(req: Request): string | null {
  return getCookieValue(req.headers.get("cookie"), "presentation_share_token");
}

export async function getSharePermissionForPresentation(
  databaseId: string,
  shareToken: string
): Promise<PresentationSharePermission | null> {
  const database = await Database.findOne({
    _id: databaseId,
    "shareLinks.token": shareToken,
  }).select("shareLinks");

  if (!database) return null;

  const link = (database.shareLinks || []).find((entry: any) => entry.token === shareToken);
  if (!link) return null;

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return null;
  }

  return link.permission === "edit" ? "edit" : "view";
}

export function hasRequiredPresentationPermission(
  actual: PresentationSharePermission,
  required: PresentationSharePermission
): boolean {
  if (required === "view") return actual === "view" || actual === "edit";
  return actual === "edit";
}
