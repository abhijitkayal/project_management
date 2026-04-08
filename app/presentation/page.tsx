"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, FolderOpen, Plus, Monitor, Sparkles } from "lucide-react";
import { SpinnerFullscreen } from "@/components/ui/spinner";
import PresentationView from "@/components/presentation/PresentationView";
import ShareButton from "@/components/ShareButton";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";

type PresentationRecord = {
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

export default function PresentationPage() {
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
  const [presentationName, setPresentationName] = useState("Untitled presentation");
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

  const presentations = useMemo<PresentationRecord[]>(() => {
    return projects.flatMap((project) => {
      const projectPresentations = databasesByProject[project._id] as DatabaseRecord[] | undefined;
      return projectPresentations
        ? projectPresentations
            .filter((db) => db.viewType === "presentation")
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

  const selectedPresentation = presentations.find((item) => item._id === selectedDatabaseId) ?? null;

  const handleCreatePresentation = async () => {
    const targetProjectId = projectId || activeProjectId || projects[0]?._id;
    if (!targetProjectId || creating) return;

    setCreating(true);
    try {
      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjectId,
          name: presentationName.trim() || "Untitled presentation",
          icon: "🎯",
          viewType: "presentation",
          templateName: "blank",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create presentation");
      }

      await fetchDatabases(targetProjectId);
      router.push(`/presentation?db=${data._id}`);
    } catch (error) {
      console.error("Failed to create presentation:", error);
    } finally {
      setCreating(false);
    }
  };

  const openPresentation = (id: string) => {
    router.push(`/presentation?db=${id}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <SpinnerFullscreen text="Loading presentations..." />
      </div>
    );
  }

  if (selectedPresentation) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="border-b border-white/10 bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600 px-4 py-3 shadow-lg shadow-black/10">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/presentation")}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/20 transition"
              >
                <ArrowLeft size={16} />
                Presentation library
              </button>
              <ShareButton
                resourceId={selectedPresentation._id}
                resourceName={selectedPresentation.name}
                resourceType="presentation"
                collaboratorProjectId={selectedPresentation.projectId}
              />
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-lg backdrop-blur">
                {selectedPresentation.projectEmoji || "📁"}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">Current deck</div>
                <h1 className="text-lg font-semibold leading-tight">{selectedPresentation.name}</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-57px)] overflow-hidden bg-slate-100 p-4 sm:p-6">
          <div className="mx-auto h-full max-w-[1600px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5">
            <PresentationView databaseId={selectedPresentation._id} />
          </div>
        </div>
      </div>
    );
  }

  const projectOptions = projects.length > 0 ? projects : [];

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="relative overflow-hidden border-b border-white/10 bg-linear-to-br from-slate-950 via-slate-900 to-violet-950 px-6 py-10 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-[8%] top-[8%] h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="absolute right-[10%] top-[4%] h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute bottom-[10%] left-[45%] h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/75 backdrop-blur">
            <Sparkles size={14} />
            Presentation workspace
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Open a deck, create a new one, and keep each slide edit tied to its own database id.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                The sidebar now lands here. Pick an existing presentation or create a new project-scoped deck, then all edits save against that record.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/8 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Plus size={16} />
                Create presentation
              </div>
              <div className="mt-4 space-y-3">
                <input
                  value={presentationName}
                  onChange={(event) => setPresentationName(event.target.value)}
                  placeholder="Presentation name"
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
                  onClick={handleCreatePresentation}
                  disabled={creating || projectOptions.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Monitor size={16} />
                  {creating ? "Creating..." : "Create presentation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Existing presentations</h2>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Each deck is backed by its own database document.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
            <FolderOpen size={14} />
            {presentations.length} decks
          </div>
        </div>

        {presentations.length === 0 ? (
          <div className={`rounded-3xl border p-10 text-center ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20">
              <Monitor size={24} />
            </div>
            <h3 className="mt-4 text-xl font-semibold">No presentations yet</h3>
            <p className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Create the first deck from the card above. It will open with its own id and persist directly to the database.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {presentations.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => openPresentation(item._id)}
                className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${isDark ? "border-white/10 bg-white/5 hover:bg-white/8" : "border-slate-200 bg-white hover:border-slate-300"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 text-xl text-white shadow-lg shadow-violet-500/20">
                      {item.icon || "🎯"}
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight text-slate-950 dark:text-white">{item.name}</h3>
                      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {item.projectEmoji || "📁"} {item.projectName || "Project"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                    {item._id.slice(-6)}
                  </span>
                </div>
                <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "recently"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}