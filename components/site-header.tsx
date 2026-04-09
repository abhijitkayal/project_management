"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LogOut, Menu, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes";
import { useAuth } from "./AuthContext";
import { useState } from "react";

export function SiteHeader() {
  const { setTheme ,resolvedTheme } = useTheme();
  const { logout } = useAuth();
  const isDark = resolvedTheme === "dark";

  // const [showSharePopover, setShowSharePopover] = useState(false);
  
  const setGlobalTheme = (dark: boolean) => setTheme(dark ? "dark" : "light");
  const toggleSidebar = () => {
    window.dispatchEvent(new Event("oork-toggle-sidebar"));
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Button type="button" variant="ghost" size="icon" className="-ml-1" onClick={toggleSidebar}>
          <Menu />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard Section</h1>
      </div>
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
    </header>
  )
}
