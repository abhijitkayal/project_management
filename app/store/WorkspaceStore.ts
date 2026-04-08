// app/store/WorkspaceStore.ts
import { create } from "zustand";

export type ViewType =
  | "timeline" | "table" | "board" | "gallery"
  | "editor" | "documentation" 
  | "presentation" | "video" | "whiteboard" | "socialmedia"
  | "chart" | "settings";

export type Project = {
  _id:          string;
  name:         string;
  emoji:        string;
  /* ── new fields (optional so old code doesn't break) ── */
  status?:      "Not started" | "In progress" | "Done";
  priority?:    "Low" | "Medium" | "High";
  progress?:    number;
  description?: string;
};

export type DbViewTab = {
  id:        string;
  label:     string;
  icon:      string;
  type:      string;
  groupBy?:  string;
  sortBy?:   string;
  sortDir?:  "asc" | "desc";
  filters?:  any[];
  isDefault?: boolean;
};

export type DbSettings = {
  layout?:            string;
  hiddenProperties?:  string[];
  groupBy?:           string;
  filters?:           any[];
  sorts?:             any[];
  conditionalColors?: any[];
};

export type Database = {
  _id:          string;
  projectId:    string;
  name:         string;
  icon:         string;
  viewType:     ViewType;
  templateName?: string;
  order?:       number;
  views?:       DbViewTab[];
  settings?:    DbSettings;
};

type WorkspaceState = {
  projects:             Project[];
  databasesByProject:   Record<string, Database[]>;
  activeProjectId:      string | null;
  activeDatabaseId:     string | null;
  activeDatabaseObject: Database | null;

  fetchProjects:       () => Promise<void>;
  fetchDatabases:      (projectId: string) => Promise<void>;
  setActiveProject:    (projectId: string) => void;
  setActiveDatabase:   (dbIdOrObject: string | Database) => void;
  clearActiveDatabase: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projects:             [],
  databasesByProject:   {},
  activeProjectId:      null,
  activeDatabaseId:     null,
  activeDatabaseObject: null,

  fetchProjects: async () => {
    try {
      const res  = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      set({ projects: Array.isArray(data) ? data : [] });
    } catch (err) { console.error("fetchProjects:", err); }
  },

  fetchDatabases: async (projectId) => {
    try {
      const res  = await fetch(`/api/databases?projectId=${projectId}`, { cache: "no-store" });
      const data = await res.json();
      set((state) => ({
        databasesByProject: {
          ...state.databasesByProject,
          [projectId]: Array.isArray(data) ? data : [],
        },
      }));
    } catch (err) { console.error("fetchDatabases:", err); }
  },

  setActiveProject: (projectId) => {
    set({ activeProjectId: projectId, activeDatabaseId: null, activeDatabaseObject: null });
    get().fetchDatabases(projectId);
  },

  setActiveDatabase: (dbIdOrObject) => {
    if (typeof dbIdOrObject === "string") {
      const allDbs = Object.values(get().databasesByProject).flat();
      const found  = allDbs.find((db) => db._id === dbIdOrObject) ?? null;
      set({ activeDatabaseId: dbIdOrObject, activeDatabaseObject: found });
    } else {
      set({ activeDatabaseId: dbIdOrObject._id, activeDatabaseObject: dbIdOrObject });
    }
  },

  clearActiveDatabase: () => set({ activeDatabaseId: null, activeDatabaseObject: null }),
}));