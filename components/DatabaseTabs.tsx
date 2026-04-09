// components/DatabaseTabs.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, GripVertical } from "lucide-react";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";
import DatabaseViewRenderer from "./DatabaseViewrenderer";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import ViewPickerCard from "./ViewpickerCard";
import DatabaseViewTabs, { type DbView } from "./DatabaseViewtabs";
import type { Database } from "@/app/store/WorkspaceStore";

/* ── Default views factory ── */
function getDefaultViews(viewType: string): DbView[] {
  if (["table","timeline"].includes(viewType)) {
    return [
      { id:"all",       label:"visualization", icon:"star",   type:"all",       isDefault:true,  filters:[] },
      // { id:"by-status", label:"input", icon:"circle", type:"by-status", groupBy:"status",filters:[] },
      { id:"my-tasks",  label:"show data",  icon:"user",   type:"my-tasks",  filters:[{ field:"assignee",op:"eq",value:"me" }] },
    ];
  }
    if (["charts"].includes(viewType)) {
    return [
      { id:"all",       label:"visualization", icon:"star",   type:"all",       isDefault:true,  filters:[] },
      { id:"by-status", label:"input", icon:"circle", type:"by-status", groupBy:"status",filters:[] },
      // { id:"my-tasks",  label:"show data",  icon:"user",   type:"my-tasks",  filters:[{ field:"assignee",op:"eq",value:"me" }] },
    ];
  }
   if (["board"].includes(viewType)) {
    return [
      { id:"all",       label:"All-tasks", icon:"star",   type:"all",       isDefault:true,  filters:[] },
      { id:"by-status", label:"By-status", icon:"circle", type:"by-status", groupBy:"status",filters:[] },
      { id:"my-tasks",  label:"My Tasks",  icon:"user",   type:"my-tasks",  filters:[{ field:"assignee",op:"eq",value:"me" }] },
      // { id:"charts", label:"Charts", icon:"bar-chart-2", type:"charts", filters:[] },
    ];
  }
  // if (["documentation","text","pagelink"].includes(viewType)) {
  //   return [
  //     { id:"all",  label:"All Pages", icon:"star", type:"all",      isDefault:true, filters:[] },
  //     { id:"mine", label:"My Pages",  icon:"user", type:"my-tasks", filters:[] },
  //   ];
  // }
  return [
    // { id:"all", label:"All Items", icon:"star", type:"all", isDefault:true, filters:[] },
  ];
}

/* ══════════════════════════════════════════════════════════════
   DraggableDatabaseSection
   Each section is an independent scroll container so that
   "sticky top-0" on DatabaseViewTabs sticks WITHIN this section,
   not relative to the page.
══════════════════════════════════════════════════════════════ */
type SectionProps = {
  db:           Database;
  projectId:    string;
  isDark:       boolean;
  isViewOnly:   boolean;
  onAddBelow:   (dbId: string) => void;
  onHandleDown: (dbId: string) => void;
  onHandleUp:   () => void;
  onDragStart:  (dbId: string) => void;
  onDragEnd:    () => void;
  onDropOn:     (targetDbId: string) => void;
  isDragging:   boolean;
  isHandleActive: boolean;
  dragEnabled:  boolean;
  onToggleDrag: () => void;
};

function DraggableDatabaseSection({
  db, projectId,
  isDark, isViewOnly,
  onAddBelow, onHandleDown, onHandleUp, onDragStart, onDragEnd, onDropOn,
  isDragging, isHandleActive, dragEnabled, onToggleDrag,
}: SectionProps) {

  const rawViews: DbView[] = useMemo(
    () =>
      db.views && db.views.length > 0
        ? (db.views as DbView[])
        : getDefaultViews(db.viewType || "table"),
    [db.views, db.viewType]
  );

  const [views,        setViews]        = useState<DbView[]>(rawViews);
  const [activeViewId, setActiveViewId] = useState<string>(
    rawViews.find((v) => v.isDefault)?.id ?? rawViews[0]?.id ?? "all"
  );

  useEffect(() => { setViews(rawViews); }, [rawViews]);
 

  return (
    /*
      ┌──────────────────────────────────────────────────────────┐
      │  KEY CHANGE: each section has a fixed max-height and     │
      │  overflow-y-auto so it becomes its own scroll container. │
      │  This lets "sticky top-0" in DatabaseViewTabs stick to  │
      │  the top of THIS section, not the page.                  │
      └──────────────────────────────────────────────────────────┘
    */
    <section
      draggable={dragEnabled && isHandleActive}
      onDragStart={dragEnabled && isHandleActive ? () => onDragStart(db._id) : undefined}
      onDragEnd={dragEnabled ? onDragEnd : undefined}
      onDragOver={dragEnabled  ? (e) => e.preventDefault() : undefined}
      onDrop={dragEnabled      ? () => onDropOn(db._id) : undefined}
      id={`db-section-${db._id}`}
      className={`relative bg-background text-foreground ${isDark ? "bg-zinc-900" : "bg-transparent"} transition-all overflow-hidden max-h-[700px] flex flex-col ${
        isDragging && dragEnabled ? "opacity-60" : ""
      }`}
    >
      {/* ── Top drag-handle strip (not sticky — always at top since section is flex-col) ── */}
      <div className={`group flex items-center shrink-0 text-sm px-3 py-1 border-b ${
        isDark
          ? "text-gray-300 bg-transparent border-gray-700/60"
          : "text-gray-700 bg-transparent border-gray-200"
      }`}>
        <span
          onMouseDown={() => onHandleDown(db._id)}
          onMouseUp={onHandleUp}
          className={`p-1 rounded transition-colors ${
            dragEnabled
              ? isDark
                ? "cursor-grab text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                : "cursor-grab text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              : isDark
              ? "cursor-grab text-gray-700"
              : "cursor-grab text-gray-300"
          }`}
          title={dragEnabled ? "Drag to reorder this section" : "Enable drag mode to reorder"}
        >
          <GripVertical size={14} />
        </span>

        {/* {!isViewOnly && (
          <button
            type="button"
            onClick={() => onAddBelow(db._id)}
            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ml-1 ${
              isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
            }`}
            title="Add dataset below"
          >
            <Plus size={14} />
          </button>
        )} */}
      </div>

      {/*
        ── Scrollable inner area ──
        DatabaseViewTabs has "sticky top-0" which sticks to the
        top of this overflow-y-auto div, not the page.
      */}
      <div className="flex-1 overflow-y-auto">
        {/* ── View tabs toolbar (sticky within this scroll area) ── */}
        <DatabaseViewTabs
          dbId={db._id}
          dbName={db.name}
          dbIcon={db.icon || "📄"}
          viewType={db.viewType || "table"}
          projectId={projectId}
          views={views}
          activeViewId={activeViewId}
          isDark={isDark}
          dragEnabled={dragEnabled}
          onToggleDrag={onToggleDrag}
          onViewChange={setActiveViewId}
          onViewsChange={setViews}
        />

        {/* ── Content ── */}
        <div className={isDark ? "bg-transparent" : "bg-white"}>
          <DatabaseViewRenderer
            db={db}
            isViewOnly={isViewOnly}
            activeViewId={activeViewId}
            activeView={views.find((v) => v.id === activeViewId)}
          />
        </div>
      </div>
    </section>
  );
}


/* ══════════════════════════════════════════════════════════════
   DatabaseTabs — main export
══════════════════════════════════════════════════════════════ */
export default function DatabaseTabs({
  projectId,
  isViewOnly = false,
}: {
  projectId:   string;
  isViewOnly?: boolean;
}) {
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [showCreateDbModal,     setShowCreateDbModal]     = useState(false);
  const [insertAfterDatabaseId, setInsertAfterDatabaseId] = useState<string | null>(null);
  const [orderedIds,            setOrderedIds]            = useState<string[]>([]);
  const [draggingId,            setDraggingId]            = useState<string | null>(null);
  const [handleActiveId,        setHandleActiveId]        = useState<string | null>(null);
  const [dragEnabled,           setDragEnabled]           = useState(true);
  const lastAutoScrolledDbRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  const { databasesByProject, activeDatabaseId, setActiveDatabase, fetchDatabases } = useWorkspaceStore();
  const dbs          = useMemo(() => databasesByProject[projectId] || [], [databasesByProject, projectId]);
  const selectedDbId = searchParams.get("db");

  useEffect(() => {
    if (dbs.length === 0) return;
    const activeExists = dbs.some((db) => db._id === activeDatabaseId);
    if (!activeDatabaseId || !activeExists) setActiveDatabase(dbs[0]._id);
  }, [dbs, activeDatabaseId, setActiveDatabase]);

  useEffect(() => {
    if (!selectedDbId) {
      lastAutoScrolledDbRef.current = null;
      return;
    }
    if (lastAutoScrolledDbRef.current === selectedDbId) return;

    if (!selectedDbId) return;
    const exists = dbs.some((db) => db._id === selectedDbId);
    if (!exists) return;

    lastAutoScrolledDbRef.current = selectedDbId;
    setActiveDatabase(selectedDbId);
    const frame = window.requestAnimationFrame(() => {
      // Passive sync/navigation should not move the global window.
      scrollToDbSection(selectedDbId, 0, { allowWindowScroll: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDbId, dbs, setActiveDatabase]);

  // Keep collaborator views fresh without a full page refresh.
  useEffect(() => {
    if (!projectId) return;

    const refresh = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      try {
        await fetchDatabases(projectId);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(refresh, 4000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    const onWindowFocus = () => {
      refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [projectId, fetchDatabases]);

  const orderedDbs = useMemo(() => {
    if (orderedIds.length === 0) return dbs;
    const map     = new Map(dbs.map((db) => [db._id, db] as const));
    const sorted  = orderedIds.map((id) => map.get(id)).filter(Boolean) as Database[];
    const missing = dbs.filter((db) => !orderedIds.includes(db._id));
    return [...sorted, ...missing];
  }, [dbs, orderedIds]);

  const handleToggleDrag = () => {
    setDragEnabled((v) => !v);
    setDraggingId(null);
    setHandleActiveId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setHandleActiveId(null);
  };

  useEffect(() => {
    const clearHandle = () => setHandleActiveId(null);
    window.addEventListener("mouseup", clearHandle);
    window.addEventListener("blur", clearHandle);
    return () => {
      window.removeEventListener("mouseup", clearHandle);
      window.removeEventListener("blur", clearHandle);
    };
  }, []);

  const openCreateAfter = (dbId: string) => {
    setInsertAfterDatabaseId(dbId);
    setShowCreateDbModal(true);
  };

  const getScrollParent = (element: HTMLElement): HTMLElement | null => {
    let parent: HTMLElement | null = element.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const hasScrollableY = /(auto|scroll)/.test(style.overflowY);
      if (hasScrollableY && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return document.scrollingElement as HTMLElement | null;
  };

  const scrollToDbSection = (
    dbId: string,
    attempts = 0,
    options?: { allowWindowScroll?: boolean }
  ) => {
    const allowWindowScroll = options?.allowWindowScroll ?? true;
    const el = document.getElementById(`db-section-${dbId}`) as HTMLElement | null;
    if (!el) {
      if (attempts >= 40) return;
      window.setTimeout(() => scrollToDbSection(dbId, attempts + 1, options), 50);
      return;
    }

    const scrollParent = getScrollParent(el);
    if (!scrollParent) return;

    const topGap = 12;

    if (scrollParent === document.scrollingElement || scrollParent === document.documentElement || scrollParent === document.body) {
      if (!allowWindowScroll) return;
      const absoluteTop = window.scrollY + el.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(absoluteTop - topGap, 0), behavior: "smooth" });
      return;
    }

    const parentRect = scrollParent.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    const targetTop = scrollParent.scrollTop + (elementRect.top - parentRect.top) - topGap;
    scrollParent.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
  };
  const filteredDbs = orderedDbs.filter(
  (db) =>
    db.viewType !== "socialmedia" &&
    db.viewType !== "video" &&
    db.viewType !== "whiteboard" &&
    db.viewType !== "presentation"
);

  /* ── Empty state ── */
  if (dbs.length === 0) {
    return (
      <Card className={`shadow-sm ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <CardContent className="p-6 sm:p-8 md:p-10 text-center">
          <div className="text-4xl sm:text-5xl mb-3 opacity-40">📊</div>
          <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {isViewOnly
              ? "This project has no databases yet."
              : "No databases yet. Click New Database to get started."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDropOn = (targetDbId: string) => {
    if (!draggingId || draggingId === targetDbId) { handleDragEnd(); return; }
    const currentIds  = orderedDbs.map((db) => db._id);
    const sourceIndex = currentIds.indexOf(draggingId);
    const targetIndex = currentIds.indexOf(targetDbId);
    if (sourceIndex === -1 || targetIndex === -1) { handleDragEnd(); return; }
    const next = [...currentIds];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setOrderedIds(next);
    handleDragEnd();
  };

  return (
    <div className="space-y-6">
{filteredDbs.length === 0 ? (
  <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
    No data present yet
  </p>
) : (
  filteredDbs.map((db) => (
    <DraggableDatabaseSection
      key={db._id}
      db={db}
      projectId={projectId}
      isDark={isDark}
      isViewOnly={isViewOnly}
      onAddBelow={openCreateAfter}
      onHandleDown={setHandleActiveId}
      onHandleUp={() => setHandleActiveId(null)}
      onDragStart={setDraggingId}
      onDragEnd={handleDragEnd}
      onDropOn={handleDropOn}
      isDragging={draggingId === db._id}
      isHandleActive={handleActiveId === db._id}
      dragEnabled={dragEnabled}
      onToggleDrag={handleToggleDrag}
    />
  ))
)}

      {showCreateDbModal && !isViewOnly && (
        <ViewPickerCard
          projectId={projectId}
          insertAfterDatabaseId={insertAfterDatabaseId}
          isDark={isDark}
          onDone={(createdDbId) => {
            setShowCreateDbModal(false);

            if (createdDbId) {
              const afterId = insertAfterDatabaseId;
              setOrderedIds((prev) => {
                const current = prev.length > 0 ? prev.filter((id) => id !== createdDbId) : dbs.map((db) => db._id);
                if (!afterId) return current.includes(createdDbId) ? current : [...current, createdDbId];
                const afterIndex = current.indexOf(afterId);
                if (afterIndex === -1) return current.includes(createdDbId) ? current : [...current, createdDbId];
                const next = [...current];
                next.splice(afterIndex + 1, 0, createdDbId);
                return next;
              });
              window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => scrollToDbSection(createdDbId));
              });
            }

            setInsertAfterDatabaseId(null);
          }}
        />
      )}
    </div>
  );
}