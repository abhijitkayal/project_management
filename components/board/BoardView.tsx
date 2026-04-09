// components/board/BoardView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Calendar as CalendarIcon, MoreHorizontal, Plus } from "lucide-react";
import type { DbView } from "@/components/DatabaseViewtabs";
import { useOptionalAuth } from "@/components/AuthContext";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface Tag {
  label: string;
  color: string;
}

interface MilestonePoint {
  text: string;
  done: boolean;
}

interface Milestone {
  title: string;
  points: MilestonePoint[];
}

interface Task {
  id: UniqueIdentifier;
  dbId?: string;
  title: string;
  description?: string;
  fromDate?: string;
  toDate?: string;
  milestones?: Milestone[];
  tags: Tag[];
  date: string;
  avatars: string[];
  assignee?: string;
  status?: string;
  priority?: "Low" | "Medium" | "High";
  progress?: number;
}

interface Column {
  id: UniqueIdentifier;
  title: string;
  color: string;
  tasks: Task[];
}

interface TaskFormData {
  title: string;
  description: string;
  fromDate: string;
  toDate: string;
  email:string;
  milestones: Milestone[];
}

interface DatabaseBoardItem {
  _id: string;
  values?: {
    title?: string;
    description?: string;
    fromDate?: string;
    toDate?: string;
    milestones?: Milestone[];
    Status?: string;
    progress?: number;
    assignee?: string;
    email?: string;
  };
}

const EMPTY_FORM: TaskFormData = {
  title: "",
  description: "",
  fromDate: "",
  toDate: "",
  email:"",
  milestones: [],
};

const INITIAL_COLUMNS: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "indigo",
    tasks: [
      {
        id: 1,
        title: "Draft launch task list",
        tags: [{ label: "To Do", color: "gray" }],
        date: "No date",
        avatars: ["bg-teal-500"],
        assignee: "",
        status: "To Do",
        priority: "Medium",
        milestones: [],
      },
    ],
  },
  { id: "working", title: "Working in progress", color: "amber", tasks: [] },
  { id: "inprogress", title: "In Progress", color: "blue", tasks: [] },
  { id: "done", title: "Done", color: "emerald", tasks: [] },
];

const COLUMN_ID_TO_STATUS: Record<string, string> = {
  todo: "To Do",
  working: "Working in progress",
  inprogress: "In Progress",
  done: "Done",
};

const STATUS_TO_COLUMN_ID: Record<string, string> = {
  "To Do": "todo",
  "Working in progress": "working",
  "In Progress": "inprogress",
  Done: "done",
};

function getTagCls(color: string, isDark: boolean) {
  const map: Record<string, string> = {
    gray: isDark ? "bg-gray-500/20 text-gray-300" : "bg-gray-100 text-gray-700",
    cyan: isDark ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-100 text-cyan-700",
    red: isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-700",
    orange: isDark ? "bg-orange-500/20 text-orange-300" : "bg-orange-100 text-orange-700",
    yellow: isDark ? "bg-yellow-500/20 text-yellow-300" : "bg-yellow-100 text-yellow-700",
  };

  return map[color] ?? (isDark ? "bg-gray-500/20 text-gray-300" : "bg-gray-100 text-gray-700");
}

function formatDateRange(fromDate?: string, toDate?: string) {
  if (!fromDate && !toDate) return "No date";
  if (fromDate && toDate) return `${fromDate} - ${toDate}`;
  return fromDate || toDate || "No date";
}

function getMilestoneProgress(milestones?: Milestone[], fallbackProgress = 0) {
  if (!milestones || milestones.length === 0) return fallbackProgress;

  const allPoints = milestones.flatMap((m) => m.points || []);
  if (allPoints.length === 0) return fallbackProgress;

  const doneCount = allPoints.filter((p) => p.done).length;
  return Math.round((doneCount / allPoints.length) * 100);
}

function getMilestonePointStats(milestones?: Milestone[]) {
  if (!milestones || milestones.length === 0) return { done: 0, total: 0 };
  const allPoints = milestones.flatMap((m) => m.points || []);
  return {
    done: allPoints.filter((p) => p.done).length,
    total: allPoints.length,
  };
}

function mapDatabaseItemToTask(item: DatabaseBoardItem): Task {
  const values = item.values || {};
  const status = values.Status || "To Do";
  const progress = getMilestoneProgress(values.milestones, typeof values.progress === "number" ? values.progress : 0);

  return {
    id: item._id,
    dbId: item._id,
    title: values.title || "Untitled task",
    description: values.description || "",
    fromDate: values.fromDate || "",
    toDate: values.toDate || "",
    milestones: Array.isArray(values.milestones) ? values.milestones : [],
    tags: [{ label: status, color: "cyan" }],
    date: formatDateRange(values.fromDate, values.toDate),
    avatars: ["bg-teal-500"],
    status,
    priority: "Medium",
    progress,
    assignee: values.assignee || values.email || "",
  };
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [el] = next.splice(from, 1);
  next.splice(to, 0, el);
  return next;
}

function findCol(cols: Column[], id: UniqueIdentifier) {
  return cols.find((c) => c.id === id) ?? cols.find((c) => c.tasks.some((t) => t.id === id));
}

function CreateTaskModal({
  isOpen,
  isDark,
  isSaving,
  defaultStatus,
  onClose,
  onSave,
  loggedInEmail,
}: {
  isOpen: boolean;
  isDark: boolean;
  isSaving: boolean;
  defaultStatus: string;
  onClose: () => void;
  onSave: (form: TaskFormData) => Promise<void>;
  loggedInEmail: string;
}) {
  const [form, setForm] = useState<TaskFormData>(EMPTY_FORM);

  if (!isOpen) return null;

  const updateMilestoneTitle = (milestoneIndex: number, value: string) => {
    setForm((prev) => {
      const milestones = [...prev.milestones];
      milestones[milestoneIndex] = { ...milestones[milestoneIndex], title: value };
      return { ...prev, milestones };
    });
  };

  const updatePointText = (milestoneIndex: number, pointIndex: number, value: string) => {
    setForm((prev) => {
      const milestones = [...prev.milestones];
      const points = [...milestones[milestoneIndex].points];
      points[pointIndex] = { ...points[pointIndex], text: value };
      milestones[milestoneIndex] = { ...milestones[milestoneIndex], points };
      return { ...prev, milestones };
    });
  };

  const updatePointDone = (milestoneIndex: number, pointIndex: number, checked: boolean) => {
    setForm((prev) => {
      const milestones = [...prev.milestones];
      const points = [...milestones[milestoneIndex].points];
      points[pointIndex] = { ...points[pointIndex], done: checked };
      milestones[milestoneIndex] = { ...milestones[milestoneIndex], points };
      return { ...prev, milestones };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl border p-5 ${isDark ? "border-gray-700 bg-slate-900 text-gray-100" : "border-gray-200 bg-zinc-100 text-gray-900"}`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Create Task ({defaultStatus})</h2>
            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Assignee: {loggedInEmail || "Not available"}</p>
          </div>
          <button onClick={onClose} className={`rounded-md px-2 py-1 text-sm ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>Close</button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            title="Task title"
            aria-label="Task title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? "border-gray-700 bg-[#1d2230]" : "border-gray-300 bg-white"}`}
          />
          <input
            title="Task description"
            aria-label="Task description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? "border-gray-700 bg-[#1d2230]" : "border-gray-300 bg-white"}`}
          />
          <input
  type="email"
  placeholder="Email"
  className="border p-2 w-full mb-2"
  value={form.email}
  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
/>
          <input
            title="From date"
            aria-label="From date"
            type="date"
            value={form.fromDate}
            onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
            className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? "border-gray-700 bg-[#1d2230]" : "border-gray-300 bg-white"}`}
          />
          <input
            title="To date"
            aria-label="To date"
            type="date"
            value={form.toDate}
            onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
            className={`rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? "border-gray-700 bg-[#1d2230]" : "border-gray-300 bg-white"}`}
          />
        </div>

        <div className="mt-4 space-y-3">
          {form.milestones.map((milestone, milestoneIndex) => (
            <div key={milestoneIndex} className={`rounded-xl border p-3 ${isDark ? "border-gray-700 bg-[#11151f]" : "border-gray-200 bg-gray-50"}`}>
              <input
                title="Milestone title"
                aria-label="Milestone title"
                value={milestone.title}
                onChange={(e) => updateMilestoneTitle(milestoneIndex, e.target.value)}
                placeholder="Milestone"
                className={`mb-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? "border-gray-700 bg-[#1d2230]" : "border-gray-300 bg-white"}`}
              />

              <div className="space-y-2">
                {milestone.points.map((point, pointIndex) => (
                  <div key={pointIndex} className="flex items-center gap-2">
                    <input
                      title="Point completed"
                      aria-label="Point completed"
                      type="checkbox"
                      checked={point.done}
                      onChange={(e) => updatePointDone(milestoneIndex, pointIndex, e.target.checked)}
                    />
                    <input
                      title="Point text"
                      aria-label="Point text"
                      value={point.text}
                      onChange={(e) => updatePointText(milestoneIndex, pointIndex, e.target.value)}
                      placeholder="Point"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${isDark ? "border-gray-700 bg-[#1d2230]" : "border-gray-300 bg-white"}`}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => setForm((prev) => {
                  const milestones = [...prev.milestones];
                  const points = [...milestones[milestoneIndex].points, { text: "", done: false }];
                  milestones[milestoneIndex] = { ...milestones[milestoneIndex], points };
                  return { ...prev, milestones };
                })}
                className={`mt-2 text-xs ${isDark ? "text-blue-300" : "text-blue-600"}`}
              >
                + Add Point
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setForm((prev) => ({ ...prev, milestones: [...prev.milestones, { title: "", points: [] }] }))}
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          + Add Milestone
        </button>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            Cancel
          </button>
          <button
            disabled={isSaving || !form.title.trim()}
            onClick={() => onSave(form)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanTask({
  task,
  isDark,
  getTagColor,
  onTogglePoint,
  viewMode,
}: {
  task: Task;
  isDark: boolean;
  getTagColor: (c: string) => string;
  onTogglePoint?: (task: Task, milestoneIndex: number, pointIndex: number) => void;
  viewMode: "all" | "status";
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: task.id });
  const isDoneTask = task.status === "Done";
  const stats = getMilestonePointStats(task.milestones);
  const progress = getMilestoneProgress(task.milestones, task.progress || 0);
  const isStatusMode = viewMode === "status";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl border p-4 transition-all hover:shadow-md ${isDragging ? "opacity-50" : "opacity-100"} ${isDark ? "border-gray-800 bg-[#1F2125] hover:border-gray-700" : "border-rose-100 bg-white hover:border-rose-200"}`}
    >
      <h3 className={`mb-2 text-sm font-medium leading-snug ${isDark ? "text-gray-200" : "text-gray-800"}`}>{task.title}</h3>
      {!isStatusMode && task.description && <p className={`mb-3 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{task.description}</p>}

      {!isStatusMode && (
        <div className="mb-3 flex flex-wrap gap-2">
          {task.tags.map((tag, i) => (
            <span key={i} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getTagColor(tag.color)}`}>{tag.label}</span>
          ))}
        </div>
      )}

      {isStatusMode && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Progress {stats.total > 0 ? `(${stats.done}/${stats.total})` : ""}
            </span>
            <span className={`text-[10px] font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{progress}%</span>
          </div>
          <progress
            className="h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-teal-500 dark:[&::-webkit-progress-bar]:bg-gray-700 dark:[&::-webkit-progress-value]:bg-teal-500"
            value={progress}
            max={100}
          />
        </div>
      )}

      {!isStatusMode && task.milestones && task.milestones.length > 0 && (
        <div className="mb-3 space-y-2">
          {task.milestones.map((milestone, milestoneIndex) => (
            <div key={`${task.id}-m-${milestoneIndex}`} className={`rounded-lg border p-2 ${isDark ? "border-gray-700 bg-black/20" : "border-gray-200 bg-gray-50"}`}>
              <p className={`mb-1 text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>{milestone.title || "Milestone"}</p>
              <div className="space-y-1">
                {milestone.points.map((point, pointIndex) => (
                  <label key={`${task.id}-m-${milestoneIndex}-p-${pointIndex}`} className="flex items-center gap-2 text-[11px]">
                    <input
                      title="Mark point done"
                      aria-label="Mark point done"
                      type="checkbox"
                      checked={point.done}
                      disabled={isDoneTask}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={() => {
                        if (isDoneTask) return;
                        onTogglePoint?.(task, milestoneIndex, pointIndex);
                      }}
                    />
                    <span className={point.done ? "line-through opacity-70" : ""}>{point.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isStatusMode && (
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <CalendarIcon size={12} />
            <span>{task.date}</span>
          </div>
          <div className="flex -space-x-1.5">
            {task.avatars.map((cls, i) => (
              <div key={i} className={`h-5 w-5 rounded-full border-2 ${cls} ${isDark ? "border-[#1F2125]" : "border-white"}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  isDark,
  getTagColor,
  onAddNew,
  onTogglePoint,
  viewMode,
}: {
  column: Column;
  isDark: boolean;
  getTagColor: (c: string) => string;
  onAddNew: (columnId: string) => void;
  onTogglePoint?: (task: Task, milestoneIndex: number, pointIndex: number) => void;
  viewMode: "all" | "status";
}) {
  const { setNodeRef, isOver } = useSortable({ id: column.id, data: { type: "Column" } });
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  return (
    <div ref={setNodeRef} className="w-80 shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isDark ? "text-gray-200" : "text-gray-900"}`}>{column.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-200 text-gray-600"}`}>{column.tasks.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button title="Add" aria-label="Add" className={`rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-800 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <Plus size={16} />
          </button>
          <button title="More options" aria-label="More options" className={`rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-800 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className={`space-y-3 rounded-xl p-1 ${isOver ? (isDark ? "bg-gray-800/50" : "bg-rose-50") : ""}`}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <KanbanTask
              key={task.id}
              task={task}
              isDark={isDark}
              getTagColor={getTagColor}
              onTogglePoint={onTogglePoint}
              viewMode={viewMode}
            />
          ))}
        </SortableContext>

        <button
          onClick={() => onAddNew(String(column.id))}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2 text-xs transition-colors ${isDark ? "border-gray-800 text-gray-500 hover:bg-gray-800/50 hover:text-gray-300" : "border-rose-200 text-gray-500 hover:bg-rose-50 hover:text-gray-700"}`}
        >
          <Plus size={14} />
          <span>Add New</span>
        </button>
      </div>
    </div>
  );
}

function ByStatusBoard({
  columns,
  isDark,
  getTagColor,
  onAddNew,
  onTogglePoint,
}: {
  columns: Column[];
  isDark: boolean;
  getTagColor: (c: string) => string;
  onAddNew: (columnId: string) => void;
  onTogglePoint?: (task: Task, milestoneIndex: number, pointIndex: number) => void;
}) {
  const allTasks = columns.flatMap((c) => c.tasks);
  const totalProjects = allTasks.length;
  const completedProjects = allTasks.filter((task) => getMilestoneProgress(task.milestones, task.progress || 0) >= 100).length;
  const overallProgress = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

  return (
    <div className="p-4">
      <div className={`mb-4 rounded-xl border p-4 ${isDark ? "border-gray-700 bg-[#151821]" : "border-gray-200 bg-white"}`}>
        <div className="mb-2 flex items-center justify-between">
          <p className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Project Completion</p>
          <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{completedProjects}/{totalProjects} completed</p>
        </div>
        <progress
          className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-emerald-500 dark:[&::-webkit-progress-bar]:bg-gray-700 dark:[&::-webkit-progress-value]:bg-emerald-500"
          value={overallProgress}
          max={100}
        />
        <p className={`mt-1 text-[11px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>{overallProgress}% based on completed projects</p>
      </div>

      <div className="flex gap-6 overflow-x-auto">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            isDark={isDark}
            getTagColor={getTagColor}
            onAddNew={onAddNew}
            onTogglePoint={onTogglePoint}
            viewMode="status"
          />
        ))}
      </div>
    </div>
  );
}

function MyTasksList({ tasks, isDark, loggedInEmail }: { tasks: Task[]; isDark: boolean; loggedInEmail: string }) {
  const mine = tasks.filter((t) => t.assignee === loggedInEmail);

  if (mine.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-sm ${isDark ? "text-gray-600" : "text-gray-400"}`}>
        <p>No tasks assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {mine.map((task) => (
        <div key={task.id} className={`rounded-xl border p-4 ${isDark ? "border-gray-700 bg-[#1b1f2a]" : "border-gray-200 bg-white"}`}>
          <p className="text-sm font-semibold">{task.title}</p>
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{task.date}</p>
        </div>
      ))}
    </div>
  );
}

export default function BoardView({
  databaseId,
  activeView,
}: {
  databaseId?: string;
  activeView?: DbView;
}) {
  const { resolvedTheme } = useTheme();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const loggedInEmail = user?.email || "";
  const isDark = resolvedTheme === "dark";

  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [createStatus, setCreateStatus] = useState("To Do");
  const [loadError, setLoadError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const baseColumns = useMemo(() => INITIAL_COLUMNS.map((col) => ({ ...col, tasks: [] as Task[] })), []);
  const viewType = activeView?.type || "all";

  const loadBoardItems = useCallback(async () => {
    if (!databaseId) return;

    try {
      setLoadError(null);
      const endpoint =
        viewType === "my-tasks"
          ? `/api/board_items?mode=assigned`
          : `/api/board_items?databaseId=${databaseId}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to load board items");

      const items: DatabaseBoardItem[] = await res.json();
      const nextColumns = baseColumns.map((col) => ({ ...col, tasks: [...col.tasks] }));

      items.forEach((item) => {
        const mapped = mapDatabaseItemToTask(item);
        const status = mapped.status || "To Do";
        const targetColumnId = STATUS_TO_COLUMN_ID[status] || "todo";
        const targetColumn = nextColumns.find((col) => String(col.id) === targetColumnId);
        if (targetColumn) targetColumn.tasks.push(mapped);
      });

      setColumns(nextColumns);
    } catch (error) {
      console.error(error);
      setLoadError("Could not load board items");
    }
  }, [baseColumns, databaseId, viewType]);

  useEffect(() => {
    if (databaseId) {
      loadBoardItems();
    }
  }, [databaseId, loadBoardItems]);

  const allTasks = useMemo(() => columns.flatMap((c) => c.tasks), [columns]);
  const getTagColor = (color: string) => getTagCls(color, isDark);

  const openCreateForColumn = (columnId: string) => {
    setCreateStatus(COLUMN_ID_TO_STATUS[columnId] || "To Do");
    setIsCreateOpen(true);
  };

  const saveNewTask = async (form: TaskFormData) => {
    const values = {
      title: form.title,
      description: form.description,
      fromDate: form.fromDate,
      toDate: form.toDate,
      // assignee: loggedInEmail,
      email: form.email,
      milestones: form.milestones,
      Status: createStatus,
      progress: 0,
    };

    setIsSavingTask(true);
    try {
      if (databaseId) {
        const res = await fetch("/api/board_items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ databaseId, values }),
        });
        if (!res.ok) throw new Error("Failed to save task");
        await loadBoardItems();
        
      } else {
        const fallbackTask: Task = {
          id: `${Date.now()}`,
          title: values.title,
          description: values.description,
          fromDate: values.fromDate,
          toDate: values.toDate,
          milestones: values.milestones,
          tags: [{ label: values.Status, color: "cyan" }],
          date: formatDateRange(values.fromDate, values.toDate),
          avatars: ["bg-teal-500"],
          status: values.Status,
          assignee: loggedInEmail,
          priority: "Medium",
          progress: 0,
        };

        const targetColumnId = STATUS_TO_COLUMN_ID[createStatus] || "todo";
        setColumns((prev) =>
          prev.map((col) =>
            String(col.id) === targetColumnId ? { ...col, tasks: [fallbackTask, ...col.tasks] } : col
          )
        );
      }

      setIsCreateOpen(false);
    } finally {
      setIsSavingTask(false);
    }
  };

  const toggleMilestonePoint = async (task: Task, milestoneIndex: number, pointIndex: number) => {
    const nextMilestones = (task.milestones || []).map((milestone, idx) => {
      if (idx !== milestoneIndex) return milestone;

      const points = milestone.points.map((point, pIdx) =>
        pIdx === pointIndex ? { ...point, done: !point.done } : point
      );

      return { ...milestone, points };
    });

    const allDone =
      nextMilestones.length > 0 &&
      nextMilestones.every((milestone) => milestone.points.every((point) => point.done));
    const nextProgress = getMilestoneProgress(nextMilestones, task.progress || 0);

    const nextStatus = allDone ? "Done" : task.status || "In Progress";

    const updatedTask: Task = {
      ...task,
      milestones: nextMilestones,
      status: nextStatus,
      tags: [{ label: nextStatus, color: "cyan" }],
      progress: nextProgress,
    };

    setColumns((prev) => {
      const withoutTask = prev.map((col) => ({ ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }));
      const targetColumnId = STATUS_TO_COLUMN_ID[nextStatus] || "todo";

      return withoutTask.map((col) =>
        String(col.id) === targetColumnId ? { ...col, tasks: [updatedTask, ...col.tasks] } : col
      );
    });

    if (databaseId && task.dbId) {
      const values = {
        title: task.title,
        description: task.description || "",
        fromDate: task.fromDate || "",
        toDate: task.toDate || "",
        milestones: nextMilestones,
        Status: nextStatus,
        progress: nextProgress,
      };

      const res = await fetch(`/api/board_items/${task.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });

      if (!res.ok) {
        await loadBoardItems();
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCol = findCol(columns, active.id);
    const overCol = findCol(columns, over.id);
    if (!activeCol || !overCol) return;

    const isSame = activeCol.id === overCol.id;
    const activeIdx = activeCol.tasks.findIndex((t) => t.id === active.id);
    let overIdx = overCol.tasks.findIndex((t) => t.id === over.id);
    if (overIdx === -1) overIdx = overCol.tasks.length;

    if (isSame && activeIdx !== overIdx) {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === activeCol.id
            ? { ...col, tasks: arrayMove(activeCol.tasks, activeIdx, overIdx) }
            : col
        )
      );
      return;
    }

    if (!isSame) {
      const task = activeCol.tasks[activeIdx];
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === activeCol.id) {
            return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) };
          }
          if (col.id === overCol.id) {
            const next = [...col.tasks];
            next.splice(overIdx, 0, task);
            return { ...col, tasks: next };
          }
          return col;
        })
      );
    }
  };

  const colIds = useMemo(() => columns.map((c) => c.id), [columns]);

  if (viewType === "my-tasks") {
    return <MyTasksList tasks={allTasks} isDark={isDark} loggedInEmail={loggedInEmail} />;
  }

  if (viewType === "by-status") {
    return (
      <>
        <ByStatusBoard
          columns={columns}
          isDark={isDark}
          getTagColor={getTagColor}
          onAddNew={openCreateForColumn}
          onTogglePoint={toggleMilestonePoint}
        />
        {loadError && <p className="px-4 pb-2 text-sm text-red-500">{loadError}</p>}
        <CreateTaskModal
          key={`${isCreateOpen}-${createStatus}`}
          isOpen={isCreateOpen}
          isDark={isDark}
          isSaving={isSavingTask}
          defaultStatus={createStatus}
          onClose={() => setIsCreateOpen(false)}
          onSave={saveNewTask}
          loggedInEmail={loggedInEmail}
        />
      </>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-6 min-w-max">
            <SortableContext items={colIds} strategy={verticalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  isDark={isDark}
                  getTagColor={getTagColor}
                  onAddNew={openCreateForColumn}
                  onTogglePoint={toggleMilestonePoint}
                  viewMode="all"
                />
              ))}
            </SortableContext>
          </div>
          {loadError && <p className="mt-4 text-sm text-red-500">{loadError}</p>}
        </div>
      </DndContext>

      <CreateTaskModal
        key={`${isCreateOpen}-${createStatus}`}
        isOpen={isCreateOpen}
        isDark={isDark}
        isSaving={isSavingTask}
        defaultStatus={createStatus}
        onClose={() => setIsCreateOpen(false)}
        onSave={saveNewTask}
          loggedInEmail={loggedInEmail}
      />
    </>
  );
}


