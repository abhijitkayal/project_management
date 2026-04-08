// components/DatabaseViewTabs.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Star, CircleDot, User, Check, X, Loader2,
  Delete,
  Trash,
} from "lucide-react";

import FilterPanel,       { type FilterRule }  from "./FilterPanel";
import SortPanel,         { type SortRule }     from "./SortPanel";
import ViewSettingsPanel, { type ViewSettings } from "./ViewSettingsPanel";
import { useWorkspaceStore } from "@/app/store/WorkspaceStore";

/* ── Types ────────────────────────────────────────────────────── */
export interface DbView {
  id:        string;
  label:     string;
  icon:      string;
  type:      string;
  filters?:  Record<string, unknown>[];
  groupBy?:  string;
  isDefault?: boolean;
}

interface DatabaseViewTabsProps {
  dbId:          string;
  dbName:        string;
  dbIcon:        string;
  viewType:      string;
  projectId:     string;
  views:         DbView[];
  activeViewId:  string;
  isDark:        boolean;
  dragEnabled:   boolean;
  onToggleDrag:  () => void;
  onViewChange:  (viewId: string) => void;
  onViewsChange?: (views: DbView[]) => void;
}

/* ── Helpers ── */
async function fetchProperties(dbId: string, viewType: string) {
  const isTaskView = ["editor","board","timeline","table","gallery"].includes(viewType);
  const url = isTaskView
    ? `/api/todo/properties?databaseId=${dbId}`
    : `/api/properties?databaseId=${dbId}`;
  try {
    const data = await (await fetch(url)).json();
    return (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) => ({
      id:   String(p._id ?? p.id),
      name: String(p.name ?? ""),
      type: String(p.type ?? ""),
    }));
  } catch { return []; }
}

async function saveSettings(dbId: string, patch: Record<string, unknown>) {
  try {
    await fetch(`/api/databases/${dbId}/settings`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(patch),
    });
  } catch (e) { console.error("Failed to save settings:", e); }
}

/* ── View icon ── */
function ViewIcon({ icon, size = 13 }: { icon: string; size?: number }) {
  if (icon === "star")   return <Star      size={size} className="fill-current" />;
  if (icon === "circle") return <CircleDot size={size} />;
  if (icon === "user")   return <User      size={size} />;
  return <Star size={size} />;
}

/* ── Column headers ── */
// const COLUMN_HEADERS = [
//   { key:"name",     label:"Task name", icon:<Type      size={12}/> },
//   { key:"assignee", label:"Assignee",  icon:<Users     size={12}/> },
//   { key:"due",      label:"Due date",  icon:<Calendar  size={12}/> },
//   { key:"pastDue",  label:"Past due",  icon:<Calendar  size={12}/> },
//   { key:"status",   label:"Status",    icon:<CircleDot size={12}/> },
// ];

/* ════════════════════════════════════════════════════════════════ */
export default function DatabaseViewTabs({
  dbId, dbName, dbIcon, viewType, projectId,
  views, activeViewId, isDark,
  onViewChange, onViewsChange,
}: DatabaseViewTabsProps) {
  const { fetchDatabases } = useWorkspaceStore();
  const MAX_VISIBLE = 3;

  const [showMore,    setShowMore]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [openPanel,   setOpenPanel]   = useState<"filter"|"sort"|"settings"|null>(null);

  const [properties,   setProperties]   = useState<{ id: string; name: string; type: string }[]>([]);
  const [filters,      setFilters]      = useState<FilterRule[]>([]);
  const [sorts,        setSorts]        = useState<SortRule[]>([]);
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    layout: viewType, hiddenProperties: [], groupBy: "", conditionalColors: [],
  });

  const [name, setName] = useState(dbName);
const [editing, setEditing] = useState(false);
const [icon, setIcon] = useState(dbIcon);
const [editingIcon, setEditingIcon] = useState(false);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) {
      setName(dbName);
    }
  }, [dbName, editing]);

  useEffect(() => {
    if (!showEmojiPicker && !editingIcon) {
      setIcon(dbIcon);
    }
  }, [dbIcon, showEmojiPicker, editingIcon]);

  const COMMON_EMOJIS = [
    "📊", "📈", "📉", "📋", "📑", "📃", "📄", "📑", "🗂️", "🗳️",
    "💼", "📁", "📂", "🗂️", "🗄️", "📦", "📫", "📪", "📬", "🎯",
    "⭐", "✨", "💎", "🏆", "🎖️", "🏅", "🎗️", "🔔", "📢", "📣",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "✅", "❌", "⚠️", "🚨", "🔥", "⚡", "💥", "🌟", "💫", "✍️",
    "🎨", "🖌️", "🖍️", "✏️", "📝", "📌", "📍", "🔍", "🔎", "🔑",
    "🚀", "🛸", "✈️", "🎯", "🎪", "🎭", "🎬", "🎮", "🎲", "🎰",
    "🌈", "🌸", "🌺", "🌻", "🌷", "🌹", "🥀", "🌼", "🍀", "🌿",
    "💰", "💳", "💵", "💴", "💶", "💷", "🏦", "🏧", "⚙️", "🔧",
    "📱", "💻", "⌨️", "🖥️", "🖨️", "📠", "📞", "☎️", "📲", "📧",
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  useEffect(() => { fetchProperties(dbId, viewType).then(setProperties); }, [dbId, viewType]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await (await fetch(`/api/databases/${dbId}/settings`)).json();
        if (data.filters)               setFilters(data.filters);
        if (data.sorts)                 setSorts(data.sorts);
        if (data.hiddenProperties)      setViewSettings((vs) => ({ ...vs, hiddenProperties: data.hiddenProperties }));
        if (data.groupBy !== undefined) setViewSettings((vs) => ({ ...vs, groupBy: data.groupBy }));
        if (data.layout)                setViewSettings((vs) => ({ ...vs, layout: data.layout }));
      } catch {}
    };
    load();
  }, [dbId]);

  const persistTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const persistSettings = useCallback((patch: Record<string, unknown>) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => saveSettings(dbId, patch), 800);
  }, [dbId]);

  const handleFiltersChange = (next: FilterRule[]) => {
    setFilters(next);
    persistSettings({ filters: next });
  };
  const handleSortsChange = (next: SortRule[]) => {
    setSorts(next);
    persistSettings({ sorts: next });
  };
  const handleViewSettingsChange = (next: ViewSettings) => {
    setViewSettings(next);
    persistSettings({
      hiddenProperties:  next.hiddenProperties,
      groupBy:           next.groupBy,
      layout:            next.layout,
      conditionalColors: next.conditionalColors,
    });
  };

  const persistViews = async (next: DbView[]) => {
    setSaving(true);
    try {
      await fetch(`/api/databases/${dbId}/views`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ views: next }),
      });
      onViewsChange?.(next);
    } catch (e) { console.error("Failed to save views:", e); }
    finally { setSaving(false); }
  };

  const handleRemoveView = async (id: string) => {
    if (views.length <= 1) return;
    const next = views.filter((v) => v.id !== id);
    await persistViews(next);
    if (activeViewId === id) onViewChange(next[0].id);
  };

  const updateDbIcon = async () => {
  try {
      const res = await fetch(`/api/databases/${dbId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icon }),
    });
      if (!res.ok) {
        throw new Error(`Icon update failed (${res.status})`);
      }
      await fetchDatabases(projectId);
  } catch (err) {
    console.error("Icon update failed", err);
  }
};
  /* ── Shared classes ── */
  const tabBase     = `group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none cursor-pointer whitespace-nowrap`;
  const tabActive   = "bg-blue-600 text-white shadow";
  const tabInactive = isDark
    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800";

  /* ── Sticky wrapper bg ── */
  const stickyBg = isDark
    ? "bg-[#111827] border-gray-700/60"
    : "bg-white border-gray-200";

  const visibleViews = views.slice(0, MAX_VISIBLE);
  const hiddenViews  = views.slice(MAX_VISIBLE);

  const updateDbName = async () => {
  try {
      const res = await fetch(`/api/databases/${dbId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
      if (!res.ok) {
        throw new Error(`Name update failed (${res.status})`);
      }
      await fetchDatabases(projectId);
  } catch (_err) {
    console.error("Update failed", _err);
  }
};
const handleDeleteDatabase = async () => {
  const confirmDelete = window.confirm("Are you sure you want to delete this database?");
  if (!confirmDelete) return;

  try {
    await fetch(`/api/databases/${dbId}`, {
      method: "DELETE",
    });
    alert(dbName + " has been deleted.");
    // OPTIONAL: reload or update UI
    window.location.reload(); // quick solution
  } catch (err) {
    console.error("Delete failed", err);
  }
};

  return (
    /*
      ┌─────────────────────────────────────────────────────────┐
      │  sticky wrapper — sticks to the TOP of the nearest      │
      │  scrolling ancestor (the section's overflow container). │
      │  z-20 keeps it above the content rows but below modals. │
      └─────────────────────────────────────────────────────────┘
    */
    <div className={`sticky top-0 z-20 border-b ${stickyBg} rounded-t-xl ${isDark ? "bg-slate-800" : ""}`}>

      {/* ══ ROW 1: DB icon + name ══════════════════════════════ */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 relative">
        <div className="relative" ref={emojiPickerRef}>
          <span
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-lg leading-none cursor-pointer hover:scale-110 transition"
            title="Click to change emoji"
          >
            {icon || "📊"}
          </span>
          {showEmojiPicker && (
            <div className={`absolute top-full left-0 mt-1 z-50 p-3 rounded-lg shadow-lg border grid grid-cols-6 gap-1 w-max ${
              isDark
                ? "bg-gray-900 border-gray-700"
                : "bg-white border-gray-200"
            }`}>
              {COMMON_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setIcon(e);
                    setShowEmojiPicker(false);
                    fetch(`/api/databases/${dbId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ icon: e }),
                    }).catch((err) => console.error("Icon update failed", err));
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded text-lg hover:scale-110 transition ${
                    isDark
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-100"
                  }`}
                  title={e}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
       {editing ? (
  <input
    value={name}
    onChange={(e) => setName(e.target.value)}
    onBlur={() => {
      updateDbName();
      setEditing(false);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        updateDbName();
        setEditing(false);
      }
    }}
    className={`border px-2 py-1 rounded text-sm ${
      isDark
        ? "bg-gray-800 text-white border-gray-600"
        : "bg-white text-gray-900 border-gray-300"
    }`}
    autoFocus
  />
) : (
  <span
    onClick={() => setEditing(true)}
    className={`font-bold text-base tracking-tight cursor-pointer ${
      isDark ? "text-white" : "text-gray-900"
    }`}
  >
    {name}
  </span>
)}
        {saving && <Loader2 size={13} className="animate-spin text-blue-500 ml-1" />}
        <button
  onClick={handleDeleteDatabase}
  className={`ml-2 p-1 rounded ${
    isDark
      ? "hover:bg-red-900 text-gray-400 hover:text-red-400"
      : "hover:bg-red-100 text-gray-500 hover:text-red-600"
  }`}
  title="Delete database"
>
  <Trash size={16} />
</button>
      </div>
     

      {/* ══ ROW 2: Tabs + toolbar ══════════════════════════════ */}
      <div className="flex items-center justify-between gap-2 px-3 pb-2 flex-wrap">

        {/* ── Left: view tabs ── */}
        <div className="flex items-center gap-1 flex-wrap">

          {visibleViews.map((v) => (
            <div key={v.id} className="relative flex items-center">
              <button
                onClick={() => onViewChange(v.id)}
                className={`${tabBase} ${activeViewId === v.id ? tabActive : tabInactive}`}
              >
                <ViewIcon icon={v.icon} size={12} />
                <span>{v.label}</span>
              </button>
              {views.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveView(v.id); }}
                  className={`absolute -top-1 -right-1 hidden group-hover:flex w-3.5 h-3.5 rounded-full items-center justify-center z-10 ${
                    isDark
                      ? "bg-gray-700 text-gray-400 hover:text-red-400"
                      : "bg-gray-200 text-gray-400 hover:text-red-500"
                  }`}
                >
                  <X size={8} />
                </button>
              )}
            </div>
          ))}

          {/* N more… */}
          {hiddenViews.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowMore(!showMore)} className={`${tabBase} ${tabInactive}`}>
                {hiddenViews.length} more…
              </button>
              {showMore && (
                <div className={`absolute top-full left-0 mt-1 z-50 w-48 rounded-xl border shadow-xl py-1 ${
                  isDark ? "bg-[#1e1f26] border-gray-700" : "bg-white border-gray-200"
                }`}>
                  {hiddenViews.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { onViewChange(v.id); setShowMore(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                        activeViewId === v.id
                          ? isDark ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-600"
                          : isDark ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <ViewIcon icon={v.icon} size={11} />
                      <span className="truncate">{v.label}</span>
                      {activeViewId === v.id && <Check size={11} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add view */}
          {/* {!showNewView ? (
            <button
              onClick={() => setShowNewView(true)}
              className={`${tabBase} ${tabInactive} border border-dashed ${
                isDark ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <Plus size={11} /><span>Add view</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={newViewLabel}
                onChange={(e) => setNewViewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  handleAddView();
                  if (e.key === "Escape") { setShowNewView(false); setNewViewLabel(""); }
                }}
                placeholder="View name…"
                className={`text-xs px-2 py-1 rounded-lg border outline-none w-28 ${
                  isDark
                    ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                }`}
              />
              <button onClick={handleAddView} className="p-1 rounded text-blue-500 hover:text-blue-400">
                <Check size={13} />
              </button>
              <button
                onClick={() => { setShowNewView(false); setNewViewLabel(""); }}
                className={`p-1 rounded ${
                  isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <X size={13} />
              </button>
            </div>
          )} */}
        </div>
       
        {/* ── Right: toolbar icons + Drag toggle ── */}
        {/* <div className="flex items-center gap-1">

          {showSearch ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search tasks…"
                className={`text-xs px-2 py-1 rounded-lg border outline-none w-36 ${
                  isDark
                    ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-600"
                    : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                }`}
              />
              <button
                onClick={() => { setShowSearch(false); setSearchText(""); }}
                className={toolBtn}
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setOpenPanel(openPanel === "filter" ? null : "filter")}
                className={openPanel === "filter" ? toolBtnActive : toolBtn}
                title="Filter"
              >
                <Filter size={14} />
                {filters.length > 0 && <Badge count={filters.length} />}
              </button>

              <button
                onClick={() => setOpenPanel(openPanel === "sort" ? null : "sort")}
                className={openPanel === "sort" ? toolBtnActive : toolBtn}
                title="Sort"
              >
                <ArrowUpDown size={14} />
                {sorts.length > 0 && <Badge count={sorts.length} />}
              </button>

              <button className={toolBtn} title="Automations"><Zap       size={14} /></button>
              <button onClick={() => setShowSearch(true)} className={toolBtn} title="Search">
                <Search size={14} />
              </button>
              <button className={toolBtn} title="Fullscreen"><Maximize2  size={14} /></button>
              <button
                onClick={() => setOpenPanel(openPanel === "settings" ? null : "settings")}
                className={openPanel === "settings" ? toolBtnActive : toolBtn}
                title="View settings"
              >
                <SlidersHorizontal size={14} />
              </button>
            </>
          )}

          {/* ✅ Drag On/Off toggle */}
          {/* <button
            onClick={onToggleDrag}
            title={dragEnabled ? "Disable drag mode" : "Enable drag mode to reorder sections"}
            className={`flex items-center gap-1.5 px-3 py-1.5 ml-1 rounded-lg text-xs font-semibold border transition-all select-none ${
              dragEnabled
                ? isDark
                  ? "bg-teal-500/15 border-teal-500/40 text-teal-300 hover:bg-teal-500/25"
                  : "bg-teal-50 border-teal-400 text-teal-700 hover:bg-teal-100"
                : isDark
                ? "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
            }`}
          >
            {dragEnabled
              ? <><Unlock size={12} />Drag On</>
              : <><Lock   size={12} />Drag Off</>}
          </button> */}
        {/* </div> */} 
      </div>

      {/* ══ ROW 3: Column header bar (sticky) ══════════════════ */}
      {/* <div className={`flex items-center gap-1 px-4 py-1.5 text-xs border-t ${
        isDark ? "border-gray-700/60 bg-transparent" : "border-gray-100 bg-gray-50/80"
      }`}>
        {COLUMN_HEADERS
          .filter((col) => !viewSettings.hiddenProperties.includes(col.key))
          .map((col, i) => (
            <div
              key={col.key}
              className={`flex items-center gap-1.5 font-medium select-none ${
                isDark ? "text-gray-500" : "text-gray-400"
              } ${i === 0 ? "flex-1 min-w-[140px]" : "w-32"}`}
            >
              <span className="opacity-70">{col.icon}</span>
              <span>{col.label}</span>
            </div>
          ))}
        <div className="flex items-center gap-1 ml-auto">
          <button className={`${toolBtn} w-6 h-6`} title="Add field"><Plus size={12} /></button>
          <button className={`${toolBtn} w-6 h-6`} title="More"><MoreHorizontal size={12} /></button>
        </div>
      </div> */}

      {/* ══ ROW 4: Filter/sort chips + action buttons ══════════ */}
      {/* <div className={`flex items-center gap-2 px-4 py-2 border-t flex-wrap ${
        isDark ? "border-gray-700/60" : "border-gray-100"
      }`}>
        {filters.map((f) => (
          <span key={f.id} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isDark
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/25"
              : "bg-blue-50 text-blue-600 border border-blue-200"
          }`}>
            {f.fieldName} {f.op} {f.value ? `"${f.value}"` : ""}
            <button
              onClick={() => handleFiltersChange(filters.filter((x) => x.id !== f.id))}
              className="ml-0.5 opacity-60 hover:opacity-100"
            >
              <X size={9} />
            </button>
          </span>
        ))}

        {sorts.map((s) => (
          <span key={s.id} className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isDark
              ? "bg-violet-600/20 text-violet-400 border border-violet-500/25"
              : "bg-violet-50 text-violet-600 border border-violet-200"
          }`}>
            {s.fieldName} {s.dir === "asc" ? "↑" : "↓"}
            <button
              onClick={() => handleSortsChange(sorts.filter((x) => x.id !== s.id))}
              className="ml-0.5 opacity-60 hover:opacity-100"
            >
              <X size={9} />
            </button>
          </span>
        ))}

        <button
          onClick={() => setOpenPanel("filter")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isDark
              ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              : "border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Filter size={11} />Edit filters
        </button>

        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          isDark
            ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            : "border-gray-300 text-gray-600 hover:bg-gray-100"
        }`}>
          <Plus size={11} />New task
        </button>
      </div> */}

      {/* ══ Floating panels ════════════════════════════════════ */}
      {openPanel && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenPanel(null)} />
      )}
      {openPanel === "filter" && (
        <div className="absolute right-3 top-full mt-1 z-50">
          <FilterPanel
            properties={properties}
            filters={filters}
            isDark={isDark}
            onClose={() => setOpenPanel(null)}
            onChange={handleFiltersChange}
          />
        </div>
      )}
      {openPanel === "sort" && (
        <div className="absolute right-3 top-full mt-1 z-50">
          <SortPanel
            properties={properties}
            sorts={sorts}
            isDark={isDark}
            onClose={() => setOpenPanel(null)}
            onChange={handleSortsChange}
          />
        </div>
      )}
      {openPanel === "settings" && (
        <div className="absolute right-3 top-full mt-1 z-50">
          <ViewSettingsPanel
            dbId={dbId}
            dbName={dbName}
            viewType={viewType}
            projectId={projectId}
            properties={properties}
            settings={viewSettings}
            filterCount={filters.length}
            sortCount={sorts.length}
            isDark={isDark}
            onClose={() => setOpenPanel(null)}
            onChange={handleViewSettingsChange}
            onOpenFilter={() => setOpenPanel("filter")}
            onOpenSort={() => setOpenPanel("sort")}
          />
        </div>
      )}
    </div>
  );
}