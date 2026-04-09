"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import { Trash2, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";


/* ── Confirm Delete Modal ── */
function ConfirmDeleteModal({
  open,
  name,
  isDark,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  name: string;
  isDark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* card */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl shadow-2xl p-6 border ${
          isDark
            ? "bg-[#1a1b1f] border-white/10 text-gray-200"
            : "bg-white border-rose-100 text-gray-800"
        }`}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 size={22} className="text-red-500" />
        </div>
        <h3 className="text-center font-semibold text-base mb-1">Delete item?</h3>
        <p className={`text-center text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          <span className="font-medium">"{name}"</span> will be permanently removed and cannot be recovered.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDark
                ? "bg-white/8 hover:bg-white/12 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all shadow-md shadow-red-500/25"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsBoardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();

  const {
    projects,
    fetchProjects,
    databasesByProject,
    fetchDatabases,
  } = useWorkspaceStore();

  const [activeProjectId, setActiveProjectId] = useState<string>("");

  /* ── confirm delete state ── */
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    name: string;
    action: (() => Promise<void>) | null;
  }>({ open: false, name: "", action: null });

  const askDelete = (name: string, action: () => Promise<void>) =>
    setConfirmDelete({ open: true, name, action });

  const closeConfirm = () =>
    setConfirmDelete({ open: false, name: "", action: null });

  /* ── load projects ── */
  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── set first project as default ── */
  useEffect(() => {
    if (!activeProjectId && projects.length > 0) {
      setActiveProjectId(projects[0]._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  /* ── fetch databases when active project changes ── */
  useEffect(() => {
    if (!activeProjectId) return;
    fetchDatabases(activeProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  const activeProject = useMemo(
    () => projects.find((p) => p._id === activeProjectId),
    [projects, activeProjectId]
  );

  const tabs: { _id: string; icon: string; name: string; viewType?: string }[] =
    databasesByProject?.[activeProjectId] || [];

   /* ── delete handlers ── */
   const handleDeleteProject = async (projectId: string) => {
     try {
       await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
       await fetchProjects();
       // if deleted project was active, reset selection
       if (projectId === activeProjectId) setActiveProjectId("");
     } catch (err) {
       console.error("Failed to delete project:", err);
     }
   };

   const handleDeleteDatabase = async (dbId: string) => {
     try {
       await fetch(`/api/databases/${dbId}`, { method: "DELETE" });
       await fetchDatabases(activeProjectId);
     } catch (err) {
       console.error("Failed to delete database:", err);
     }
   };

  /* ── shared trash button style ── */
  const trashBtn = (size: "sm" | "md" = "sm") =>
    `flex items-center justify-center rounded-lg transition-all shrink-0 ${
      size === "sm" ? "w-6 h-6" : "w-7 h-7"
    } ${
      isDark
        ? "text-gray-600 hover:text-red-400 hover:bg-red-400/10"
        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
    }`;
     const filteredDbs = tabs.filter(
  (db) =>
    db.viewType !== "socialmedia" &&
    db.viewType !== "video" &&
    db.viewType !== "whiteboard" &&
    db.viewType !== "presentation"
);

  return (
    <div className={`min-h-screen border border-gray-300 rounded-2xl ${isDark ? "bg-zinc-900 text-gray-300" : "bg-white text-gray-900"}`}>
      <SiteHeader/>
      {/* Confirm delete modal */}
      <ConfirmDeleteModal
        open={confirmDelete.open}
        name={confirmDelete.name}
        isDark={isDark}
        onConfirm={async () => {
          if (confirmDelete.action) await confirmDelete.action();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />

      <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* PAGE TITLE */}
        <div className={`text-xl sm:text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
          Projects Board
        </div>
        <div className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Click a project → see its databases/tabs → open it.
        </div>

        <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">

          {/* ══════ LEFT: PROJECT LIST ══════ */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className={`rounded-xl sm:rounded-2xl border overflow-hidden shadow-sm ${isDark ? "bg-transparent border-gray-800" : "bg-transparent border-gray-200"}`}>

              {/* header */}
              <div className={`px-3 sm:px-4 py-2 sm:py-3 font-semibold text-xs sm:text-sm border-b ${isDark ? "bg-[#1e1f23] border-gray-800 text-gray-100" : "bg-rose-50 border-rose-100 text-gray-900"}`}>
                Projects
              </div>
              <p className={`px-3 sm:px-4 py-1 border-b font-mono text-xs sm:text-sm ${isDark ? "bg-[#1e1f23] border-gray-800 text-gray-500" : "bg-rose-50 border-rose-100 text-gray-400"}`}>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>

              <div className="p-2 max-h-[300px] sm:max-h-[400px] md:h-[calc(93vh-180px)] overflow-y-auto">
                {projects.map((p) => {
                  const active = p._id === activeProjectId;
                  return (
                    <div key={p._id} className="relative group/proj flex items-center gap-1 mb-0.5">
                      {/* project button */}
                      <button
                        onClick={() => setActiveProjectId(p._id)}
                        className={`flex-1 min-w-0 text-left px-3 bg-card text-card-foreground py-2.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all touch-manipulation font-medium ${
                          active
                            ? "bg-gradient-to-r from-teal-600 to-rose-600 text-white shadow-md"
                            : isDark
                              ? "text-gray-300 hover:bg-gradient-to-r hover:from-teal-600/70 hover:to-rose-600/70 hover:text-white"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <span className="mr-1.5 sm:mr-2">{p.emoji}</span>
                        <span className="truncate">{p.name}</span>
                      </button>

                      {/* 🗑 delete project — always visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          askDelete(p.name, () => handleDeleteProject(p._id));
                        }}
                        className={trashBtn("sm")}
                        title={`Delete "${p.name}"`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}

                {projects.length === 0 && (
                  <div className={`text-xs sm:text-sm px-3 py-6 text-center ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    No projects found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════ RIGHT: DATABASE TABS ══════ */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className={`rounded-xl sm:rounded-2xl border overflow-hidden flex flex-col max-h-[600px] sm:max-h-[700px] md:h-[calc(100vh-180px)] shadow-sm ${isDark ? "bg-transparent border-gray-800" : "bg-transparent border-gray-200"}`}>

              {/* header */}
              <div className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0 ${isDark ? "bg-[#1e1f23] border-gray-800" : "bg-rose-50 border-rose-100"}`}>
                <div className="w-full sm:w-auto">
                  <div className={`font-semibold text-xs sm:text-sm truncate ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                    <span className="mr-1.5">{activeProject?.emoji}</span>
                    {activeProject?.name || "Select a project"}
                  </div>
                  <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {tabs.length > 0
                      ? `${tabs.length} database${tabs.length > 1 ? "s" : ""}`
                      : "No databases"}
                  </div>
                </div>
              </div>

              {/* database grid */}
              <div className="p-2 sm:p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 overflow-y-auto flex-1">
                {filteredDbs.map((db) => (
                  <div key={db._id} className="relative group/db h-fit">
                    {/* database card */}
                    <button
                      onClick={() =>
                        router.push(`/projects/${activeProjectId}?db=${db._id}`)
                      }
                      className={`w-full rounded-xl sm:rounded-2xl border transition-all p-3 sm:p-4 text-left shadow-sm hover:shadow-lg touch-manipulation group ${
                        isDark
                          ? "bg-[#1e1f23] border-gray-700 hover:bg-[#252730] hover:border-gray-600"
                          : "bg-rose-50 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-2 pr-6">
                        <span className="text-xl sm:text-2xl shrink-0">{db.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm sm:text-base truncate ${isDark ? "text-gray-100 group-hover:text-white" : "text-gray-900 group-hover:text-gray-950"}`}>
                            {db.name}
                          </div>
                          <div className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            View: {db.viewType || "table"}
                          </div>
                        </div>
                      </div>
                      <div className={`mt-3 text-xs flex items-center gap-1.5 ${isDark ? "text-gray-500 group-hover:text-gray-400" : "text-gray-400 group-hover:text-gray-500"}`}>
                        <span>→</span>
                        <span>Click to open</span>
                      </div>
                    </button>

                    {/* 🗑 delete database — top-right corner, always visible */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        askDelete(db.name, () => handleDeleteDatabase(db._id));
                      }}
                      className={`absolute top-2 right-2 ${trashBtn("sm")} ${
                        isDark
                          ? "bg-[#1e1f23] border border-gray-700 text-gray-500 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20"
                          : "bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200"
                      } shadow-sm`}
                      title={`Delete "${db.name}"`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {tabs.length === 0 && activeProjectId && (
                  <div className={`col-span-full flex flex-col items-center justify-center py-10 sm:py-16 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    <div className="text-4xl sm:text-5xl mb-3 opacity-50">📊</div>
                    <div className="text-xs sm:text-sm text-center px-4">
                      No databases in this project yet.
                    </div>
                  </div>
                )}

                {!activeProjectId && (
                  <div className={`col-span-full flex flex-col items-center justify-center py-10 sm:py-16 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    <div className="text-4xl sm:text-5xl mb-3 opacity-50">👈</div>
                    <div className="text-xs sm:text-sm text-center px-4">
                      Select a project to view its databases
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}