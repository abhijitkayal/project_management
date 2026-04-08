"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, Eye, Edit, Lock } from "lucide-react";
import { SpinnerFullscreen } from "@/components/ui/spinner";
import SocialMediaView from "@/components/socialmedia/SocialMediaView";

type SharedResourceResponse = {
  error?: string;
  resource?: {
    _id: string;
    name: string;
    icon?: string;
    projectId?: string;
    viewType?: string;
  };
  permission?: "view" | "edit";
};

export default function SharedSocialMediaPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const params = useParams();
  const router = useRouter();

  const tokenParam = params.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<SharedResourceResponse["resource"]>(null);
  const [permission, setPermission] = useState<"view" | "edit">("view");

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Invalid share link token");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/database-shared/${token}`);
        const data = (await res.json().catch(() => ({}))) as SharedResourceResponse;

        if (!res.ok || !data.resource || !data.permission) {
          setError(data.error || "Failed to load shared social media resource");
          setIsLoading(false);
          return;
        }

        if (data.resource.viewType !== "socialmedia") {
          setError("This share link is not for a social media resource.");
          setIsLoading(false);
          return;
        }

        setResource(data.resource);
        setPermission(data.permission);

        document.cookie = `database_share_token=${encodeURIComponent(String(token))}; path=/; max-age=86400; samesite=lax`;
      } catch {
        setError("Failed to load shared social media resource");
      }

      setIsLoading(false);
    };

    void load();

    return () => {
      document.cookie = "database_share_token=; path=/; max-age=0; samesite=lax";
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <SpinnerFullscreen text="Loading shared social media resource..." />
      </div>
    );
  }

  if (error || !resource?._id) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="space-y-4 text-center">
          <Lock className={`mx-auto h-16 w-16 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>{error || "Invalid share link."}</p>
          <button type="button" onClick={() => router.push("/")} className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            Go to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="border-b border-white/10 bg-linear-to-r from-fuchsia-600 via-pink-600 to-orange-500 px-4 py-3 shadow-lg shadow-black/10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
          <button type="button" onClick={() => router.push("/socialmedia")} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition">
            <ArrowLeft size={16} />
            Social media library
          </button>
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg backdrop-blur">{resource.icon || "📱"}</div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">Shared project</div>
              <h1 className="text-lg font-semibold leading-tight">{resource.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className={`border-b px-6 py-3 ${permission === "edit" ? "border-green-500/30 bg-green-500/10" : "border-blue-500/30 bg-blue-500/10"}`}>
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 text-sm">
          {permission === "edit" ? (
            <><Edit className="h-4 w-4 text-green-400" /><span className={isDark ? "text-green-300" : "text-green-700"}>You have edit access to this social media resource.</span></>
          ) : (
            <><Eye className="h-4 w-4 text-blue-400" /><span className={isDark ? "text-blue-300" : "text-blue-700"}>You have view-only access to this social media resource.</span></>
          )}
        </div>
      </div>

      <div className="h-[calc(100vh-104px)] overflow-hidden bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto h-full max-w-[1600px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5">
          <SocialMediaView databaseId={resource._id} />
        </div>
      </div>
    </div>
  );
}
