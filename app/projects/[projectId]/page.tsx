"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import ProjectHeader from "@/components/ProjectHeader";
import DatabaseTabs from "@/components/DatabaseTabs";
import CreateDatabasePopover from "@/components/CreateDatabasePopover";
import { useTheme } from "next-themes";
import { SpinnerFullscreen } from "@/components/ui/spinner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function ProjectPage() {
  const { resolvedTheme} = useTheme();
  const params = useParams();
  const search = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const projectId = params.projectId as string;
  const createDb = search.get("createDb") === "1";

  const { projects, fetchProjects, fetchDatabases } =
    useWorkspaceStore();

    const isDark = resolvedTheme === "dark";

  const project = useMemo(
    () => projects.find((p) => p._id === projectId),
    [projects, projectId]
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchProjects();
      await fetchDatabases(projectId);
      setIsLoading(false);
    };
    loadData();
  }, [projectId, fetchProjects, fetchDatabases]);

  if (isLoading || !project) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-800 text-white" : "bg-gray-50 text-gray-900"}`}>
        <SpinnerFullscreen text="Loading project..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen rounded-2xl border border-gray-300 ${isDark ? "bg-zinc-900 text-white" : "bg-white text-gray-900"}`}>
      {/* <AppSidebar/> */}
      <SiteHeader/>
      <div className="w-full max-w-7xl mx-auto px-6 py-10 ">
        <ProjectHeader project={project} />

        <div className="mt-8 flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Databases
          </h2>
          <CreateDatabasePopover projectId={projectId} defaultOpen={createDb} />
        </div>

        <div className="mt-6">
          <DatabaseTabs projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
