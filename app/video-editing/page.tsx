"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, FolderOpen, Plus, Film, Sparkles } from "lucide-react";
import { SpinnerFullscreen } from "@/components/ui/spinner";
import VideoView from "@/components/video/VideoView";
import ShareButton from "@/components/ShareButton";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";

type VideoRecord = {
  _id: string;
  name: string;
  icon?: string;
  projectId: string;
  updatedAt?: string;
  createdAt?: string;
  viewType: string;
  projectName?: string;
  projectEmoji?: string;
};

type DatabaseRecord = {
  _id: string;
  name: string;
  icon?: string;
  viewType: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function VideoEditingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const {
    projects,
    databasesByProject,
    activeProjectId,
    fetchProjects,
    fetchDatabases,
  } = useWorkspaceStore();

  const selectedDatabaseId = searchParams.get("db");
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [videoName, setVideoName] = useState("Untitled video project");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      await fetchProjects();
      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchProjects]);

  useEffect(() => {
    projects.forEach((project) => {
      if (!databasesByProject[project._id]) {
        fetchDatabases(project._id);
      }
    });
  }, [projects, databasesByProject, fetchDatabases]);

  useEffect(() => {
    if (projectId) return;
    if (activeProjectId) {
      setProjectId(activeProjectId);
      return;
    }
    if (projects[0]?._id) {
      setProjectId(projects[0]._id);
    }
  }, [activeProjectId, projectId, projects]);

  const videos = useMemo<VideoRecord[]>(() => {
    return projects.flatMap((project) => {
      const projectVideos = databasesByProject[project._id] as DatabaseRecord[] | undefined;
      return projectVideos
        ? projectVideos
            .filter((db) => db.viewType === "video")
            .map((db) => ({
              _id: db._id,
              name: db.name,
              icon: db.icon,
              projectId: project._id,
              updatedAt: db.updatedAt,
              createdAt: db.createdAt,
              viewType: db.viewType,
              projectName: project.name,
              projectEmoji: project.emoji,
            }))
        : [];
    });
  }, [projects, databasesByProject]);

  const selectedVideo = videos.find((video) => video._id === selectedDatabaseId) ?? null;

  const handleCreateVideo = async () => {
    const targetProjectId = projectId || activeProjectId || projects[0]?._id;
    if (!targetProjectId || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjectId,
          name: videoName.trim() || "Untitled video project",
          icon: "🎥",
          viewType: "video",
          templateName: "blank",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create video project");
      }

      await fetchDatabases(targetProjectId);
      router.push(`/video-editing?db=${data._id}`);
    } catch (error) {
      console.error("Failed to create video project:", error);
    } finally {
      setCreating(false);
    }
  };

  const openVideo = (videoId: string) => {
    router.push(`/video-editing?db=${videoId}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <SpinnerFullscreen text="Loading video projects..." />
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="border-b border-white/10 bg-linear-to-r from-blue-600 via-cyan-600 to-teal-600 px-4 py-3 shadow-lg shadow-black/10">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/video-editing")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition"
              >
                <ArrowLeft size={16} />
                Video library
              </button>
              <ShareButton
                resourceId={selectedVideo._id}
                resourceName={selectedVideo.name}
                resourceType="video"
                collaboratorProjectId={selectedVideo.projectId}
              />
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg backdrop-blur">
                {selectedVideo.projectEmoji || "📁"}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">Current project</div>
                <h1 className="text-lg font-semibold leading-tight">{selectedVideo.name}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-57px)] overflow-hidden bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto h-full max-w-[1600px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5">
            <VideoView databaseId={selectedVideo._id} />
          </div>
        </div>
      </div>
    );
  }

  const projectOptions = projects.length > 0 ? projects : [];

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="relative overflow-hidden border-b border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-10 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="absolute right-[10%] top-[4%] h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute bottom-[10%] left-[45%] h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/75 backdrop-blur">
            <Sparkles size={14} />
            Video editing workspace
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Open a video project, create a new one, and keep each edit tied to its own database id.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                The sidebar now lands here. Pick an existing video project or create a new project-scoped video workspace, then all edits save against that record.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Plus size={16} />
                Create video project
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={videoName}
                  onChange={(event) => setVideoName(event.target.value)}
                  placeholder="Video project name"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                />
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  aria-label="Select project"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select a project</option>
                  {projectOptions.map((project) => (
                    <option key={project._id} value={project._id} className="text-slate-900">
                      {project.emoji} {project.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCreateVideo}
                  disabled={creating || projectOptions.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Film size={16} />
                  {creating ? "Creating..." : "Create video project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Existing video projects</h2>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Each video project is backed by its own database document.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            <FolderOpen size={14} />
            {videos.length} projects
          </div>
        </div>

        {videos.length === 0 ? (
          <div className={`rounded-3xl border p-10 text-center ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <Film size={24} />
            </div>
            <h3 className="mt-4 text-xl font-semibold">No video projects yet</h3>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Create the first video project from the card above. It will open with its own id and persist directly to the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <button
                key={video._id}
                type="button"
                onClick={() => openVideo(video._id)}
                className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${isDark ? "border-white/10 bg-white/5 hover:bg-white/8" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 text-xl text-white shadow-lg shadow-blue-500/20">
                      {video.icon || "🎥"}
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight text-slate-950 dark:text-white">{video.name}</h3>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {video.projectEmoji || "📁"} {video.projectName || "Project"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                    {video._id.slice(-6)}
                  </span>
                </div>
                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Updated {video.updatedAt ? new Date(video.updatedAt).toLocaleString() : "recently"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}