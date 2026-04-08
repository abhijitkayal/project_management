"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Search, Mic, LogOut, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "./AuthContext";

/* ── palette for initial-based avatars ── */
const AVATAR_COLORS = [
  "bg-violet-500", "bg-indigo-500", "bg-sky-500",
  "bg-emerald-500", "bg-pink-500",  "bg-amber-500",
  "bg-rose-500",   "bg-teal-500",
];

export interface Collaborator {
  _id:     string;
  name?:   string;
  email?:  string;
  avatar?: string; // optional image URL
}

/* ─── Collaborator Avatars ──────────────────────────────────── */
function CollaboratorAvatars({
  collaborators,
  max = 4,
}: {
  collaborators: Collaborator[];
  max?:          number;
}) {
  const visible  = collaborators.slice(0, max);
  const overflow = collaborators.length - max;
  const [tooltip, setTooltip] = useState<string | null>(null);
  


  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((c, i) => {
          const displayName = c.name || c.email || "User";
          const initials = displayName
            .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];

          return (
            <div
              key={c._id}
              onMouseEnter={() => setTooltip(displayName)}
              onMouseLeave={() => setTooltip(null)}
              className="relative w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-visible cursor-default shrink-0"
              style={{ zIndex: visible.length - i }}
            >
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.avatar} alt={displayName}
                  className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center text-white text-[10px] font-bold ${colorClass}`}>
                  {initials}
                </div>
              )}

              {tooltip === displayName && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded-md bg-gray-800 text-white text-[11px] whitespace-nowrap pointer-events-none z-50 shadow">
                  {displayName}
                </div>
              )}
            </div>
          );
        })}

        {overflow > 0 && (
          <div
            title={`${overflow} more`}
            className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 shrink-0"
            style={{ zIndex: 0 }}
          >
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Header ───────────────────────────────────────────── */
export default function Header({
  collaborators = [],
  title = "Team Project",
}: {
  collaborators?: Collaborator[];
  title?: string;
}) {
  const { setTheme ,resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = resolvedTheme === "dark";

  const [showSharePopover, setShowSharePopover] = useState(false);
  
  const setGlobalTheme = (dark: boolean) => setTheme(dark ? "dark" : "light");

  return (
    <div
      className={`px-6 py-4 border-b ${
        isDark ? "bg-[#0F1014] border-gray-800" : "bg-teal-50 border-teal-200"
      }`}
    >
      <div className="flex justify-between items-center">

        {/* LEFT — avatars + title */}
        <div className="flex items-center gap-3 ml-14">

          {/* Collaborator avatars */}
          {collaborators.length > 0 ? (
            <CollaboratorAvatars collaborators={collaborators} max={4} />
          ) : (
            /* fallback single dot when no collaborators passed */
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500" />
          )}

          <h2 className={isDark ? "text-white" : "text-black"}>
            {title}
          </h2>
        </div>

         {/* CENTER — search */}
         <div className="flex-1 max-w-md mx-6">
           <div
             className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
               isDark ? "bg-[#18191d]" : "bg-white"
             }`}
           >
             <Search size={16} />
             <Input placeholder="Search..." className="border-0 bg-transparent" />
             <Mic size={16} />
           </div>
         </div>

         {/* RIGHT — actions */}
         <div className="flex items-center gap-4">
          <div>
                     
                        <div className="relative w-full rounded-2xl overflow-hidden bg-linear-to-br from-rose-500 via-pink-500 to-purple-500"
                          >
                          <div className={`flex w-full rounded-2xl p-1 gap-1 `}>
                            <button onClick={()=>setGlobalTheme(false)} title="Light mode"
                              // style={!isDark?{boxShadow:"0 3px 0 #c0707a,inset 0 1px 0 rgba(255,255,255,0.4)"}:{}}
                              className={`flex flex-1 px-3 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-y-0.5 active:shadow-none select-none ${!isDark?"bg-linear-to-b from-white to-rose-50 text-amber-600":"text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
                              <Sun size={15}/>
                            </button>
                            <button onClick={()=>setGlobalTheme(true)} title="Dark mode"
                              // style={isDark?{boxShadow:"0 3px 0 #050608,inset 0 1px 0 rgba(255,255,255,0.08)"}:{}}
                              className={`flex flex-1 px-3 items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:translate-y-0.5 active:shadow-none select-none ${isDark?"bg-linear-to-b from-[#2e3040] to-[#1e2030] text-indigo-300":"text-gray-400 hover:text-gray-600 hover:bg-black/5"}`}>
                              <Moon size={15}/>
                            </button>
                          </div>
                        </div> 
                    </div>
           {/* Logout */}
           <button
             onClick={logout}
             className="relative px-4 py-3 rounded-xl font-semibold text-sm text-white
               bg-linear-to-br from-rose-500 via-pink-500 to-purple-500
               shadow-lg shadow-pink-500/25
               hover:shadow-xl hover:shadow-pink-500/40
               transform hover:-translate-y-0.5 hover:scale-105
               transition-all duration-200
               active:translate-y-0 active:scale-95"
           >
             <span className="relative z-10 flex items-center gap-2">
               <LogOut size={16} />
               Logout
             </span>
           </button>
          </div>

        </div>
      </div>
  )
};
