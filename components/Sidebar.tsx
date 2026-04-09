// components/Sidebar.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "./Modal";
import { FiChevronsRight } from "react-icons/fi";
import {
  LayoutGrid, Calendar, Activity, Inbox,
  Plus, Moon, Sun, FileText, Layout, Store,
  ChevronDown, ChevronRight, Menu, X,
  MoreHorizontal, Pin, PinOff, Smile,
  Database, Table, Layout as LayoutIcon, CheckSquare,
  Film, BarChart2, FileCode, Link2, Globe, Presentation,
  Folder,
  PresentationIcon,
  AppWindow,
  Clapperboard,
  Video,
  ImagePlus,
} from "lucide-react";
import logo from "../public/uploads/OORK_SPACE_Logos-removebg-preview.png";
import Image from "next/image";
/* ── Workspace Logo (permanent) ── */
const WORKSPACE_LOGO = "data:image/png;base64,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";


/* ── Emoji list ── */
export const EMOJI_LIST = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","😉","😍","🥰","😘","😋","😎","🤓","🥳","😭","😡",
  "📁","📂","🗂️","📋","📌","📍","🗃️","🗄️","💼","🏢","🔧","⚙️","🛠️","🔩","💡","🔑","🗝️","🔒","🔓","🎯",
  "🌱","🌿","🍀","🌲","🌳","🌴","🌵","🌸","🌺","🌻","⭐","🌟","✨","💫","🔥","❄️","🌈","☀️","🌙","⚡",
  "🎨","🎭","📷","🎥","🎬","📺","🎙️","📢","📣","🎵","🐶","🐱","🦊","🐻","🐼","🦁","🐯","🦋","🐝","🦅",
  "🍕","🍔","🌮","🍜","🍣","🎂","☕","🍎","🍇","🥑","🏆","🥇","🎖️","🏅","🎗️","🎀","🎉","🎊","🎆","🎇",
  "🚀","✈️","🚂","🚢","🏠","🏗️","🌍","🗺️","🧭","🔭","📚","📖","✏️","🖊️","📝","📓","📔","📒","📃","📜",
  "✅","☑️","❌","⚠️","🔗","📎","🧑‍💻","👤","👥","💬","📅","🗓️","⏰","⌛","⏳","📊","📈","📉","💰","💳",
];

/* ── Types ── */
type MenuKey =
  | "dashboard" | "project-board" | "whiteboard" | "presentation" | "video-editing" | "social-media" | "task-board"
  | "schedule"  | "activities"    | "inbox"
  | "template"  | "market-places";

type SidebarPage = {
  _id: string; pageName: string; menuKey: MenuKey;
  emoji: string; createdAt: string; updatedAt: string;
};
type Project = {
  _id: string; name: string; emoji: string;
  createdAt?: string; updatedAt?: string;
};
type DbEntry = {
  _id: string; name: string; icon: string; viewType: string;
};
interface SidebarProps { view: string; setView: (view: string) => void; }

/* ── 3D Board Icon ── */
function ProjectBoardIcon3D({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none"
      style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))" }}>
      <rect x="2" y="5" width="28" height="22" rx="3" fill="url(#pb_board)" />
      <path d="M2 25 h28 l3 3 H5 Z" fill="url(#pb_depth)" />
      <path d="M30 5 l3 3 v20 L30 27 Z" fill="url(#pb_side)" />
      <rect x="2" y="5" width="28" height="5" rx="3" fill="url(#pb_rail)" />
      <rect x="6"  y="16" width="5" height="10" rx="1.5" fill="url(#pb_b1)" />
      <rect x="13" y="19" width="5" height="7"  rx="1.5" fill="url(#pb_b2)" />
      <rect x="20" y="21" width="5" height="5"  rx="1.5" fill="url(#pb_b3)" />
      <polyline points="8.5,18 15.5,15 22.5,13" stroke="#fbbf24" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
      <circle cx="8.5"  cy="18" r="1.5" fill="#fbbf24"/>
      <circle cx="15.5" cy="15" r="1.5" fill="#fbbf24"/>
      <circle cx="22.5" cy="13" r="1.5" fill="#fbbf24"/>
      <circle cx="7"  cy="7.5" r="1.2" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="7.5" r="1.2" fill="rgba(255,255,255,0.35)"/>
      <circle cx="15" cy="7.5" r="1.2" fill="rgba(255,255,255,0.2)"/>
      <rect x="2" y="5" width="28" height="3" rx="3" fill="url(#pb_shine)" opacity="0.22"/>
      <defs>
        <linearGradient id="pb_board" x1="2" y1="5" x2="30" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b"/><stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>
        <linearGradient id="pb_rail" x1="2" y1="5" x2="30" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0891b2"/><stop offset="100%" stopColor="#0e7490"/>
        </linearGradient>
        <linearGradient id="pb_depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1a2a"/><stop offset="100%" stopColor="#060d15"/>
        </linearGradient>
        <linearGradient id="pb_side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#16222e"/><stop offset="100%" stopColor="#080f18"/>
        </linearGradient>
        <linearGradient id="pb_b1" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#2dd4bf"/><stop offset="100%" stopColor="#0d9488"/>
        </linearGradient>
        <linearGradient id="pb_b2" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient>
        <linearGradient id="pb_b3" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#fb7185"/><stop offset="100%" stopColor="#e11d48"/>
        </linearGradient>
        <linearGradient id="pb_shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── View-type → small icon ── */
function DbIcon({ viewType, size = 11 }: { viewType: string; size?: number }) {
  const cls = "shrink-0 opacity-60";
  if (viewType === "table"        ) return <Table         size={size} className={cls}/>;
  if (viewType === "board"        ) return <LayoutIcon    size={size} className={cls}/>;
  if (viewType === "todo"         ) return <CheckSquare   size={size} className={cls}/>;
  if (viewType === "gallery"      ) return <LayoutIcon    size={size} className={cls}/>;
  if (viewType === "timeline"     ) return <BarChart2     size={size} className={cls}/>;
  if (viewType === "video"        ) return <Film          size={size} className={cls}/>;
  if (viewType === "chart"        ) return <BarChart2     size={size} className={cls}/>;
  if (viewType === "documentation") return <FileCode      size={size} className={cls}/>;
  if (viewType === "pagelink"     ) return <Link2         size={size} className={cls}/>;
  if (viewType === "socialmedia"  ) return <Globe         size={size} className={cls}/>;
  if (viewType === "presentation" ) return <Presentation  size={size} className={cls}/>;
  return <Database size={size} className={cls}/>;
}

/* ── WorkspaceLogo with animated glow border ── */
function WorkspaceLogo({ open, isDark }: { open: boolean; isDark: boolean }) {
  return open ? (
    /* ── Expanded: full banner ── */
    <div className="relative mx-3 rounded-2xl overflow-hidden"
      style={{
        background: isDark
          ? "linear-gradient(135deg,#0f1117 0%,#1a1b22 100%)"
          : "linear-gradient(135deg,#fff5f7 0%,#fde8ec 100%)",
      }}
    >
      {/* animated gradient border ring */}
      <div className="absolute inset-0 rounded-2xl p-[2px] z-0"
        style={{
          background:
            "linear-gradient(120deg,#0ea5e9,#a855f7,#ec4899,#f97316,#0ea5e9)",
          backgroundSize: "300% 300%",
          animation: "gradientSpin 4s linear infinite",
        }}
      >
        <div className={`w-full h-full rounded-[14px] ${isDark ? "bg-[#0f1117]" : "bg-rose-50/95"}`}/>
      </div>

      {/* glow halo behind logo */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-34 h-12 rounded-full blur-2xl opacity-40"
          style={{ background: "linear-gradient(90deg,#0ea5e9,#ec4899)" }}/>
      </div>

      {/* logo image */}
      <div className="relative z-10 flex items-center justify-center py-4 px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={WORKSPACE_LOGO}
          alt="Oork Space"
          className="h-12 w-34 object-fill drop-shadow-[0_0_10px_rgba(14,165,233,0.7)]"
          style={{ filter: isDark ? "brightness(1.15) drop-shadow(0 0 8px #0ea5e9aa)" : "drop-shadow(0 0 6px #ec4899aa)", mixBlendMode: "screen" }}
        />
      </div>

      <style jsx>{`
        @keyframes gradientSpin {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  ) : (
    /* ── Collapsed: small glowing icon ── */
    <div className="flex justify-center px-3">
      <div className="relative w-14 h-14 rounded-xl flex items-center justify-center"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#0f1117,#1a1b22)"
            : "linear-gradient(135deg,#fff5f7,#fde8ec)",
          boxShadow: isDark
            ? "0 0 0 1.5px #0ea5e9,0 0 12px 2px #0ea5e980,0 0 24px 4px #a855f740"
            : "0 0 0 1.5px #ec4899,0 0 12px 2px #ec489980,0 0 24px 4px #0ea5e940",
          animation: "pulseGlow 2.5s ease-in-out infinite",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* <img
          src={logo}
          alt="Oork Space"
          className="w-9 h-9 object-contain"
          style={{ filter: isDark ? "brightness(1.2) drop-shadow(0 0 4px #0ea5e9)" : "drop-shadow(0 0 4px #ec4899)" }}
        /> */}
      
      </div>
      <style jsx>{`
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 1.5px #0ea5e9,0 0 10px 2px #0ea5e970,0 0 20px 3px #a855f730; }
          50%      { box-shadow: 0 0 0 2px   #a855f9,0 0 18px 4px #a855f990,0 0 32px 6px #0ea5e950; }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ProjectItem
════════════════════════════════════════════════════ */
function ProjectItem({
  project, isDark, databases,
  isCollapsed, isPinned,
  onToggleCollapse, onTogglePin, onChangeEmoji,
  onOpenDb,
  
}: {
  project:          Project;
  isDark:           boolean;
  databases:        DbEntry[];
  isCollapsed:      boolean;
  isPinned:         boolean;
  onToggleCollapse: () => void;
  onTogglePin:      () => void;
  onChangeEmoji:    (emoji: string) => void;
  onOpenDb:         (projectId: string, dbId: string) => void;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = pathname.includes(project._id);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const navigateToProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/projects/${project._id}`);
  };

  const menuBg  = isDark ? "bg-[#1e1f26] border-gray-700 shadow-2xl" : "bg-white border-gray-200 shadow-xl";
  const itemCls = `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left ${
    isDark ? "text-gray-300 hover:bg-gray-800 hover:text-white" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
  }`;

  const filteredDbs = databases.filter(
  (db) =>
    db.viewType !== "socialmedia" &&
    db.viewType !== "video" &&
    db.viewType !== "whiteboard" &&
    db.viewType !== "presentation"
);
  return (
    <div>
      <div className={`flex items-center gap-1 group/proj rounded-xl px-1 py-0.5 transition-colors ${
        isDark ? "hover:bg-white/5" : "hover:bg-rose-100/60"
      }`}>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleCollapse(); }}
          title={isCollapsed ? "Expand databases" : "Collapse databases"}
          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
            isDark ? "text-gray-600 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
          }`}
        >
          <motion.span animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.18, ease: "easeInOut" }} className="flex">
            <ChevronDown size={13} />
          </motion.span>
        </button>

        <button type="button" onClick={navigateToProject} className="flex items-center gap-2 flex-1 min-w-0 text-left py-1">
          <span className="text-base leading-none shrink-0">{project.emoji}</span>
          <span className={`text-xs font-semibold truncate ${
            isActive ? isDark ? "text-white" : "text-gray-900" : isDark ? "text-gray-300" : "text-gray-700"
          }`}>{project.name}</span>
        </button>

        {isActive && (
          <span className="shrink-0 flex items-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
            </span>
          </span>
        )}

        {isPinned && <Pin size={10} className={`shrink-0 ${isDark ? "text-amber-400" : "text-amber-500"}`}/>}

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); setEmojiOpen(false); }}
            className={`opacity-0 group-hover/proj:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded ${
              isDark ? "text-gray-500 hover:text-gray-200 hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
            }`}
            title="Options"
          >
            <MoreHorizontal size={13}/>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1,    y: 0 }}
                exit={{    opacity: 0, scale: 0.95, y: -4 }}
                transition={{ type: "spring", damping: 22, stiffness: 340 }}
                className={`absolute right-0 top-full mt-1 z-[9999] w-52 rounded-2xl border overflow-hidden ${menuBg}`}
              >
                {!emojiOpen ? (
                  <div className="p-1.5 space-y-0.5">
                    <div className={`flex items-center gap-2 px-3 py-1.5 text-[10px] rounded-xl ${isDark?"text-gray-600":"text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : isDark ? "bg-gray-700" : "bg-gray-300"}`}/>
                      {isActive ? "Currently active" : "Not active"}
                    </div>
                    <div className={`border-t mx-2 my-1 ${isDark?"border-gray-700/60":"border-gray-100"}`}/>
                    <button onClick={(e) => { e.stopPropagation(); onToggleCollapse(); setMenuOpen(false); }} className={itemCls}>
                      {isCollapsed
                        ? <><ChevronRight size={13} className="text-blue-400"/><span>Expand databases</span></>
                        : <><ChevronDown  size={13} className="text-blue-400"/><span>Collapse databases</span></>}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onTogglePin(); setMenuOpen(false); }} className={itemCls}>
                      {isPinned
                        ? <><PinOff size={13} className="text-amber-400"/><span>Unpin project</span></>
                        : <><Pin    size={13} className="text-amber-400"/><span>Pin to top</span></>}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEmojiOpen(true); }} className={itemCls}>
                      <Smile size={13} className="text-violet-400"/>
                      <span>Change emoji</span>
                      <span className="ml-auto text-base leading-none">{project.emoji}</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className={`flex items-center gap-2 px-3 py-2 border-b ${isDark?"border-gray-700/60":"border-gray-100"}`}>
                      <button onClick={(e) => { e.stopPropagation(); setEmojiOpen(false); }}
                        className={`p-0.5 rounded ${isDark?"text-gray-400 hover:text-gray-200":"text-gray-400 hover:text-gray-700"}`}>
                        <ChevronDown size={13} className="rotate-90"/>
                      </button>
                      <span className={`text-[11px] font-semibold ${isDark?"text-gray-300":"text-gray-700"}`}>Pick emoji</span>
                    </div>
                    <div className="p-2 grid grid-cols-7 gap-0.5 max-h-48 overflow-y-auto">
                      {EMOJI_LIST.map((emoji) => (
                        <button key={emoji}
                          onClick={(e) => { e.stopPropagation(); onChangeEmoji(emoji); setMenuOpen(false); setEmojiOpen(false); }}
                          className={`text-lg w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-125 active:scale-95 ${
                            project.emoji === emoji
                              ? isDark ? "bg-teal-500/20 ring-1 ring-teal-500/50" : "bg-teal-100 ring-1 ring-teal-400"
                              : isDark ? "hover:bg-white/10" : "hover:bg-rose-50"
                          }`}>{emoji}
                        </button>
                      ))}
                    </div>
                    <div className={`px-3 py-2 border-t flex items-center gap-2 text-[10px] ${isDark?"border-gray-700/60 text-gray-500":"border-gray-100 text-gray-400"}`}>
                      <span className="text-base">{project.emoji}</span>
                      <span>Currently selected</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="db-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className={`ml-4 mt-0.5 pl-3 border-l space-y-0.5 pb-1 ${isDark ? "border-gray-700/60" : "border-gray-200"}`}>
              {filteredDbs.length === 0 ? (
                <p className={`text-[10px] py-1.5 pl-1 italic ${isDark?"text-gray-700":"text-gray-400"}`}>No databases yet.</p>
              ) : (
                filteredDbs.map((db) => (
                  <button key={db._id} type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenDb(project._id, db._id); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors text-left ${
                      pathname.includes(db._id)
                        ? isDark ? "bg-blue-600/15 text-blue-300" : "bg-blue-50 text-blue-700"
                        : isDark ? "text-gray-500 hover:bg-white/5 hover:text-gray-300" : "text-gray-600 hover:bg-rose-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="text-sm leading-none shrink-0">{db.icon}</span>
                    <span className="truncate flex-1">{db.name}</span>
                    <DbIcon viewType={db.viewType}/>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   Sidebar
════════════════════════════════════════════════════ */
export default function Sidebar({ view, setView }: SidebarProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [mounted,          setMounted]          = useState(false);
  const [open,             setOpen]             = useState(true);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [projectBoardOpen, setProjectBoardOpen] = useState(true);

  const [pages,    setPages]    = useState<SidebarPage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [databasesByProject, setDatabasesByProject] = useState<Record<string, DbEntry[]>>({});
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [pinnedProjects,    setPinnedProjects]    = useState<Set<string>>(new Set());

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pageForm, setPageForm] = useState<{ pageName: string; menuKey: MenuKey | ""; emoji: string }>({
    pageName: "", menuKey: "", emoji: "",
  });
  const [lastSavedName, setLastSavedName] = useState("");
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", emoji: "📁" });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setEmojiPickerOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleToggleSidebar = () => {
      if (window.innerWidth < 1024) {
        setMobileOpen((value) => !value);
        return;
      }

      setOpen((value) => !value);
    };

    window.addEventListener("oork-toggle-sidebar", handleToggleSidebar);
    return () => window.removeEventListener("oork-toggle-sidebar", handleToggleSidebar);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await (await fetch("/api/projects")).json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setProjects([]);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      const data = await (await fetch("/api/sidebar")).json();
      setPages(Array.isArray(data) ? data : []);
    } catch {
      setPages([]);
    }
  }, []);

  const fetchDatabases = useCallback(async (projectId: string) => {
    try {
      const data = await (await fetch(`/api/databases?projectId=${projectId}`)).json();
      setDatabasesByProject((prev) => ({
        ...prev,
        [projectId]: Array.isArray(data) ? data : [],
      }));
    } catch {
      setDatabasesByProject((prev) => ({ ...prev, [projectId]: [] }));
    }
  }, []);

  useEffect(() => { fetchProjects(); fetchPages(); }, [fetchProjects, fetchPages]);
  useEffect(() => { projects.forEach((p) => fetchDatabases(p._id)); }, [projects, fetchDatabases]);

  const toggleCollapse = useCallback((id: string) =>
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    }), []);

  const togglePin = useCallback((id: string) =>
    setPinnedProjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    }), []);

  const changeProjectEmoji = useCallback(async (projectId: string, emoji: string) => {
    setProjects((prev) => prev.map((p) => p._id === projectId ? { ...p, emoji } : p));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch { fetchProjects(); }
  }, [fetchProjects]);

  const handleOpenDb = useCallback((projectId: string, dbId: string) => {
    router.push(`/projects/${projectId}?db=${dbId}`);
  }, [router]);

  const isDark = resolvedTheme === "dark";
  const setGlobalTheme = (dark: boolean) => setTheme(dark ? "dark" : "light");
  const navigateTo = (path: string) => { if (pathname !== path) router.push(path); setMobileOpen(false); };

  const openCreateModal = (menuKey: MenuKey) => {
    setPageForm({ pageName: "", menuKey, emoji: "" });
    setLastSavedName(""); setCurrentPageId(null);
    setCreateModalOpen(true);
  };
  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setPageForm({ pageName: "", menuKey: "", emoji: "" });
    setLastSavedName(""); setCurrentPageId(null);
  };

  const handleCreateOrUpdatePage = async () => {
    if (!pageForm.pageName.trim() || pageForm.pageName === lastSavedName) return;
    try {
      if (currentPageId) {
        await fetch(`/api/sidebar?id=${currentPageId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageName: pageForm.pageName, emoji: pageForm.emoji }),
        });
      } else {
        const data = await (await fetch("/api/sidebar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pageForm),
        })).json();
        setCurrentPageId(data._id);
      }
      await fetchPages();
      setLastSavedName(pageForm.pageName);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (pageForm.pageName.trim() && createModalOpen && pageForm.pageName !== lastSavedName) {
      const t = setTimeout(handleCreateOrUpdatePage, 800);
      return () => clearTimeout(t);
    }
  }, [pageForm.pageName, pageForm.emoji, createModalOpen]);

  const handleDeletePage = async (pageId: string) => {
    try { await fetch(`/api/sidebar?id=${pageId}`, { method: "DELETE" }); await fetchPages(); }
    catch (err: any) { alert(err.message); }
  };

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) return;
    try {
      await fetch("/api/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectForm.name, emoji: projectForm.emoji }),
      });
      await fetchProjects();
      setProjectForm({ name: "", emoji: "📁" });
      setEmojiPickerOpen(false);
      setCreateProjectModalOpen(false);
    } catch {}
  };

  if (!mounted) return null;

  const hoverClass = isDark ? "hover:bg-white/5" : "hover:bg-rose-200/50";

  const sortedProjects = [
    ...projects.filter((p) => pinnedProjects.has(p._id)),
    ...projects.filter((p) => !pinnedProjects.has(p._id)),
  ];
  // console.log(sortedProjects);

  const docsPath = user?.id ? `/editor/${user.id}` : "/editor";
  
  const menuItems: { key: MenuKey; label: string; path: string; icon: React.ReactNode }[] = [
    { key: "dashboard",     label: "Dashboard",     path: "/",              icon: <LayoutGrid size={open?20:22}/> },
    { key: "project-board", label: "Project Board", path: "/project-board", icon: <Folder size={open?22:24}/> },
    // { key: "docs", label: "Docs", path: docsPath, icon: <FileText size={open?20:22}/> },
    {key: "whiteboard", label:"Whiteboard", path:"/whiteboard", icon: <AppWindow size={open?22:24}/> },
    {key: "presentation", label:"Presentation", path:"/presentation", icon: <PresentationIcon size={open?22:24}/> },
    {key: "video-editing", label:"VideoEditing", path:"/video-editing", icon: <Clapperboard size={open?22:24}/> },
    {key: "social-media", label:"SocialMedia", path:"/socialmedia", icon: <ImagePlus size={open?22:24}/> },

    { key: "task-board",    label: "Task Board",    path: "/task-board",    icon: <FileText   size={open?20:22}/> },
    { key: "schedule",      label: "Schedule",      path: "/schedule",      icon: <Calendar   size={open?20:22}/> },
    { key: "activities",    label: "Activities",    path: "/activities",    icon: <Activity   size={open?20:22}/> },
    { key: "inbox",         label: "Inbox",         path: "/inbox",         icon: <Inbox      size={open?20:22}/> },
    { key: "template",      label: "Template",      path: "/template",      icon: <Layout     size={open?20:22}/> },
    { key: "market-places", label: "Market Places", path: "/market-places", icon: <Store      size={open?20:22}/> },
  ];

  const SidebarContent = () => (
    <>
      <div className={`flex-1 overflow-y-auto pb-16 ${isDark ? "bg-gray-900" : "bg-zinc-100"}`}>

        {/* ── LOGO ── */}
        {/* <div className={`${open ? "pt-5 pb-3" : "px-3 pt-4 pb-2"}`}> */}
          {/* <WorkspaceLogo open={open} isDark={isDark} /> */}
          <div className={`w-full h-20 ${isDark ? "bg-[#0F1014] border-none" : "bg-teal-50 border-b border-teal-50"} pt-3 px-4 mb-4`}>
          <Image
  src={logo}
  alt="Work Space"
  // width={100}
  // height={100}
  className="w-50 h-45 object-contain flex items-center justify-center mx-auto -mt-15"
/>
{/* <hr className={`w-full`} /> */}
</div>
        {/* </div> */}

        {/* NAV */}
        <div className={`${open ? "px-6 py-2" : "px-2 py-2"}`}>
          <div className="space-y-2 relative">
            {open && <div className={`absolute left-[8px] top-0 bottom-0 w-px ${isDark?"bg-none":"bg-none"}`}/>}

            {menuItems.map((item) => {
              const isActive  = pathname === item.path;
              const itemPages = pages.filter((p) => p.menuKey === item.key);

              return (
                <div key={item.key} className="rounded-xl overflow-visible relative">
                  {open && <div className={`absolute left-[10px] top-0 w-[28px] h-[25px] rounded-bl-lg ${isDark?"border-gray-700":"border-gray-300"}`}/>}

                  <div className="relative cursor-pointer group" onClick={() => navigateTo(item.path)}>
                    <div className={`absolute inset-0 w-60 ml-3 bg-gradient-to-r from-teal-600 to-rose-600 rounded-xl transition-opacity ${isActive?"opacity-100":"opacity-0 group-hover:opacity-40"}`}/>
                    <div className={`relative flex items-center ${open?"gap-3 px-4":"justify-center px-2"} py-2 ${isActive?"text-white":isDark?"text-gray-400":"text-gray-700"}`}>
                      {item.key==="project-board" ? (
                        <span className="ml-3 flex items-center justify-center"><Folder size={open?22:24}/></span>
                      ) : itemPages.length > 0 ? (
                        <span className="text-xl flex-shrink-0 ml-3">{itemPages[0].emoji||""}</span>
                      ) : (
                        <motion.div layout className={`grid h-full ${open?"w-10":"w-full"} place-content-center text-lg ml-3`}>
                          {item.icon}
                        </motion.div>
                      )}
                      {open && (
                        <div className="flex items-center justify-between w-full">
                          <motion.span layout className="font-medium">{item.label}</motion.span>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (item.key === "project-board") {
                                  setCreateProjectModalOpen(true);
                                  return;
                                }
                                if (item.key === "whiteboard") {
                                  navigateTo("/whiteboard");
                                  return;
                                }
                                if (item.key === "video-editing") {
                                  navigateTo("/video-editing");
                                  return;
                                }
                                if (item.key === "presentation") {
                                  navigateTo("/presentation");
                                  return;
                                }
                                if (item.key === "social-media") {
                                  navigateTo("/socialmedia");
                                  return;
                                }
                                openCreateModal(item.key);
                              }}
                              className={`p-1 rounded-md ${hoverClass}`} title="Add">
                              {item.key!=="dashboard" && item.key!=="whiteboard" && item.key!=="video-editing" && item.key!=="presentation" && item.key!=="social-media" && <Plus size={16}/>}
                            </button>
                            {item.key==="project-board" && (
                              <button onClick={() => setProjectBoardOpen((v)=>!v)} className={`p-1 rounded-md ${hoverClass}`}>
                                <ChevronDown size={16} className={`transition-transform ${projectBoardOpen?"rotate-0":"-rotate-90"}`}/>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {open && (
                    item.key==="project-board" ? (
                      projectBoardOpen && (
                        <div className="pl-6 pb-2 space-y-0.5 relative">
                          {sortedProjects.length > 0 && (
                            <div className={`absolute left-[30px] top-2 bottom-0 w-[2px] ${isDark?"bg-gray-600":"bg-gray-400"}`}/>
                          )}
                          {sortedProjects.length === 0 ? (
                            <p className={`text-xs px-3 py-2 rounded-xl ml-[32px] ${isDark?"text-gray-500 bg-white/5":"text-gray-600 bg-white"}`}>
                              No projects yet. Create one.
                            </p>
                          ) : (
                            sortedProjects.map((project) => (
                              <div key={project._id} className="relative">
                                <div className={`absolute left-[8px] top-3 w-[28px] h-[14px] border-l-2 border-b-2 rounded-bl-lg ${isDark?"border-gray-600":"border-gray-400"}`}/>
                                <div className="ml-[32px]">
                                   <ProjectItem
                                    project={project} isDark={isDark}
                                    databases={databasesByProject[project._id] || []}
                                    isCollapsed={collapsedProjects.has(project._id)}
                                    isPinned={pinnedProjects.has(project._id)}
                                    onToggleCollapse={() => toggleCollapse(project._id)}
                                    onTogglePin={() => togglePin(project._id)}
                                    onChangeEmoji={(emoji) => changeProjectEmoji(project._id, emoji)}
                                    onOpenDb={handleOpenDb}
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )
                    ) : (
                      <div className="pl-6 pb-2 space-y-1 relative">
                        {itemPages.length > 0 && (
                          <div className={`absolute left-[8px] top-2 bottom-0 w-[2px] ${isDark?"bg-gray-600":"bg-gray-400"}`}/>
                        )}
                        {itemPages.slice(0,5).map((p, i) => {
                          const bgColors = [
                            isDark?"bg-purple-500/10":"bg-purple-100",
                            isDark?"bg-blue-500/10"  :"bg-blue-100",
                            isDark?"bg-green-500/10" :"bg-green-100",
                            isDark?"bg-orange-500/10":"bg-orange-100",
                            isDark?"bg-pink-500/10"  :"bg-pink-100",
                          ];
                          return (
                            <div key={p._id} className="relative">
                              <div className={`absolute left-[8px] top-0 w-[28px] h-[14px] border-l-2 border-b-2 rounded-bl-lg ${isDark?"border-gray-600":"border-gray-400"}`}/>
                              <div className={`group text-xs px-3 py-2 rounded-lg cursor-pointer transition-all ml-[32px] ${bgColors[i%5]} ${isDark?"text-gray-300 hover:brightness-125":"text-gray-800 hover:brightness-95"}`}
                                onClick={(e) => { e.stopPropagation(); alert(`Open page: ${p.pageName}`); }}>
                                <div className="flex items-center gap-2 justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-lg flex-shrink-0">{p.emoji||""}</span>
                                    <span className="truncate font-medium">{p.pageName}</span>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); if(confirm(`Delete "${p.pageName}"?`)) handleDeletePage(p._id); }}
                                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${isDark?"hover:bg-white/10":"hover:bg-white/50"}`}>
                                    <span className="text-xs">✕</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Theme Toggle */}
          {/* <div className={`mt-4 ${open?"px-1":"flex justify-center"}`}>
            {open ? (
              <div className="relative w-full rounded-2xl overflow-hidden"
                style={{ boxShadow:isDark?"0 6px 0 #0a0b0e,0 8px 16px rgba(0,0,0,0.6)":"0 6px 0 #e0a0a8,0 8px 16px rgba(190,80,100,0.25)" }}>
                <div className={`flex w-full rounded-2xl p-1 gap-1 ${isDark?"bg-[#1a1b1f]":"bg-rose-100"}`}>
                  <button onClick={()=>setGlobalTheme(false)} title="Light mode"
                    style={!isDark?{boxShadow:"0 3px 0 #c0707a,inset 0 1px 0 rgba(255,255,255,0.4)"}:{}}
                    className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-y-[2px] active:shadow-none select-none ${!isDark?"bg-gradient-to-b from-white to-rose-50 text-amber-600":"text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
                    <Sun size={15}/><span>Light</span>
                  </button>
                  <button onClick={()=>setGlobalTheme(true)} title="Dark mode"
                    style={isDark?{boxShadow:"0 3px 0 #050608,inset 0 1px 0 rgba(255,255,255,0.08)"}:{}}
                    className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-y-[2px] active:shadow-none select-none ${isDark?"bg-gradient-to-b from-[#2e3040] to-[#1e2030] text-indigo-300":"text-gray-400 hover:text-gray-600 hover:bg-black/5"}`}>
                    <Moon size={15}/><span>Dark</span>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setGlobalTheme(!isDark)} title={isDark?"Light":"Dark"}
                style={{ boxShadow:isDark?"0 4px 0 #050608,0 6px 12px rgba(0,0,0,0.5)":"0 4px 0 #d08090,0 6px 12px rgba(190,80,100,0.2)" }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:translate-y-[3px] active:shadow-none ${isDark?"bg-gradient-to-b from-[#2e3040] to-[#1e2030] text-indigo-300":"bg-gradient-to-b from-white to-rose-50 text-amber-500"}`}>
                {isDark?<Moon size={18}/>:<Sun size={18}/>}
              </button>
            )}
          </div> */}
        </div>
      </div>

      {/* Collapse button */}
      {/* <motion.button layout onClick={()=>setOpen((v)=>!v)}
        className={`hidden lg:flex  bottom-0 left-0 border-t z-50 ${isDark?"border-gray-800 bg-[#0F1014] hover:bg-[#1a1b1e]":"border-rose-200 bg-rose-50 hover:bg-rose-100"}`}
        style={{ width:open?"300px":"80px" }}>
        <div className={`flex items-center ${open?"justify-end px-4":"justify-center"} p-2`}>
          <motion.div layout className={`grid ${open?"size-10":"size-8"} place-content-center`}>
            <FiChevronsRight className={`${!open&&"rotate-180"} ${isDark?"text-gray-400":"text-gray-600"}`} size={open?20:18}/>
          </motion.div>
          {open&&<motion.span layout className="text-xs font-medium">Hide</motion.span>}
        </div>
      </motion.button> */}
    </>
  );

  return (
    <>
      <button onClick={()=>setMobileOpen(!mobileOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl shadow-lg ${isDark?"bg-[#0F1014] text-gray-300 border border-gray-800":"bg-white text-gray-900 border border-rose-200"}`}>
        {mobileOpen?<X size={24}/>:<Menu size={24}/>}
      </button>

      <AnimatePresence>
        {mobileOpen&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40"/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen&&(
          <motion.nav initial={{x:-300}} animate={{x:0}} exit={{x:-300}}
            transition={{type:"spring",damping:25,stiffness:200}}
            className={`lg:hidden fixed top-0 left-0 h-screen w-[300px] z-40 flex flex-col font-sans border-r ${isDark?"bg-[#0F1014] text-gray-300 border-gray-800":"bg-rose-50 text-gray-900 border-rose-200"}`}>
            <SidebarContent/>
          </motion.nav>
        )}
      </AnimatePresence>

      <motion.nav layout
        className={`hidden lg:flex h-screen flex-col font-sans shrink-0 relative border-t ${isDark?"bg-[#0F1014] text-gray-300 border-gray-800":"bg-rose-50 text-gray-900 border-rose-200"}`}
        style={{width:open?"300px":"80px",minWidth:open?"300px":"80px"}}>
        <SidebarContent/>
      </motion.nav>

      {/* Create Page Modal */}
      {createModalOpen&&(
        <Modal isOpen={createModalOpen} onClose={closeCreateModal} title="New Page" isDark={isDark}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl border-2 border-dashed flex-shrink-0"
                style={{borderColor:isDark?"rgba(255,255,255,0.1)":"#fecdd3"}}>{pageForm.emoji}</div>
              <input value={pageForm.pageName} onChange={(e)=>setPageForm((pv)=>({...pv,pageName:e.target.value}))}
                placeholder="Page name..." autoFocus
                className={`w-full p-4 rounded-2xl border outline-none ${isDark?"bg-white/5 border-white/10 text-white":"bg-white border-rose-100 text-gray-900"}`}/>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      {createProjectModalOpen&&(
        <Modal isOpen={createProjectModalOpen}
          onClose={()=>{setCreateProjectModalOpen(false);setProjectForm({name:"",emoji:"📁"});setEmojiPickerOpen(false);}}
          title="New Project" isDark={isDark}>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div ref={emojiPickerRef} className="relative flex-shrink-0">
                <button type="button" onClick={()=>setEmojiPickerOpen((v)=>!v)}
                  className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center border-2 transition-all hover:scale-110 active:scale-95 select-none cursor-pointer ${emojiPickerOpen?(isDark?"border-teal-500 bg-teal-500/10":"border-teal-400 bg-teal-50"):(isDark?"border-white/10 bg-white/5 hover:border-white/25":"border-rose-200 bg-white hover:border-rose-400 shadow-sm")}`}>
                  {projectForm.emoji}
                </button>
                <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap ${isDark?"text-gray-500":"text-gray-400"}`}>tap to change</span>
                <AnimatePresence>
                  {emojiPickerOpen&&(
                    <motion.div initial={{opacity:0,scale:0.95,y:-4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:-4}}
                      transition={{type:"spring",damping:20,stiffness:320}}
                      className={`absolute top-16 left-0 z-[999] w-64 rounded-2xl border shadow-2xl overflow-hidden ${isDark?"bg-[#1c1d21] border-white/10":"bg-white border-rose-100"}`}>
                      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-56 overflow-y-auto">
                        {EMOJI_LIST.map((emoji)=>(
                          <button key={emoji} type="button" onClick={()=>{setProjectForm((pv)=>({...pv,emoji}));setEmojiPickerOpen(false);}}
                            className={`text-xl w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-125 active:scale-95 ${projectForm.emoji===emoji?(isDark?"bg-teal-500/20 ring-1 ring-teal-500/60":"bg-teal-100 ring-1 ring-teal-400"):(isDark?"hover:bg-white/10":"hover:bg-rose-50")}`}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className={`px-3 py-2 border-t flex items-center gap-2 ${isDark?"border-white/10":"border-rose-100"}`}>
                        <span className="text-lg">{projectForm.emoji}</span>
                        <span className={`text-xs ${isDark?"text-gray-500":"text-gray-400"}`}>Selected</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input value={projectForm.name} onChange={(e)=>setProjectForm((pv)=>({...pv,name:e.target.value}))}
                onKeyDown={(e)=>e.key==="Enter"&&handleCreateProject()}
                placeholder="Project name..." autoFocus
                className={`w-full mt-1 p-4 rounded-2xl border outline-none transition-colors ${isDark?"bg-white/5 border-white/10 text-white focus:border-teal-500/40":"bg-white border-rose-100 text-gray-900 focus:border-teal-300 shadow-sm"}`}/>
            </div>
            <button onClick={handleCreateProject} disabled={!projectForm.name.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-rose-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity mt-6">
              Create Project
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}