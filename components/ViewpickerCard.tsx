"use client";

import { useState } from "react";
import { useWorkspaceStore, ViewType } from "@/app/store/WorkspaceStore";
import { X } from "lucide-react";

const OPTIONS: { type: ViewType; title: string; desc: string; icon: string }[] = [
  { type:"timeline",      title:"Timeline",      desc:"Plan by dates",          icon:"🗓"  },
  { type:"table",         title:"Table",         desc:"Rows & properties",      icon:"📊"  },
  { type:"board",         title:"Board",         desc:"Kanban workflow",        icon:"🧩"  },
  { type:"gallery",       title:"Gallery",       desc:"Cards layout",           icon:"🖼"  },
  { type:"editor",          title:"Editor",          desc:"Task list",              icon:"✅"  },
 
  { type:"documentation", title:"Documentation", desc:"Rich document editor",   icon:"🧾"  },
  // { type:"presentation",  title:"Presentation",  desc:"Slides and decks",       icon:"🎯"  },
  { type:"chart",         title:"Charts",        desc:"Data visualizations",    icon:"📊"  },
];

const TEMPLATES: Record<string, { id: number; name: string; desc: string }[]> = {
  table:         [{ id:1,name:"Blank Table",       desc:"Start from scratch" },{ id:2,name:"Project Tracker",  desc:"Track project status" },{ id:3,name:"Budget Tracking",desc:"Monitor expenses" }],
  board:         [{ id:1,name:"Blank Board",        desc:"Start from scratch" },{ id:2,name:"Sprint Planning",  desc:"Organize sprint tasks" },{ id:3,name:"Content Calendar",desc:"Plan content" }],
  timeline:      [{ id:1,name:"Blank Timeline",     desc:"Start from scratch" },{ id:2,name:"Project Timeline", desc:"Gantt chart planning" },{ id:3,name:"Product Roadmap",desc:"Product development" }],
  gallery:       [{ id:1,name:"Blank Gallery",      desc:"Start from scratch" },{ id:2,name:"Design Portfolio",desc:"Showcase designs" },{ id:3,name:"Product Catalog", desc:"Display products" }],
  editor:          [{ id:1,name:"Blank Editor",         desc:"Start from scratch" },{ id:2,name:"Daily Tasks",     desc:"Organize daily work" },{ id:3,name:"Checklist",      desc:"Simple checklist" }],
 
  documentation: [{ id:1,name:"Blank Document",     desc:"Start with a clean slate" },{ id:2,name:"Resume / CV",desc:"Professional resume template" },{ id:3,name:"Report",desc:"Formal report with sections" }],

  // presentation:  [{ id:1,name:"Blank Presentation", desc:"Start from scratch" },{ id:2,name:"Business Pitch", desc:"Professional pitch deck" },{ id:3,name:"Product Demo", desc:"Product showcase slides" }],

  chart: [
    { id:1, name:"Bar Chart",    desc:"Compare categories horizontally" },
    { id:2, name:"Line Chart",   desc:"Show trends & changes over time" },
    { id:3, name:"Pie Chart",    desc:"Display parts of a whole" },
    { id:4, name:"Area Chart",   desc:"Emphasize cumulative magnitude" },
    { id:5, name:"Scatter Plot", desc:"Explore variable correlations" },
    { id:6, name:"Column Chart", desc:"Vertical bar comparisons" },
    { id:7, name:"Bubble Chart", desc:"Three-variable visualization" },
  ],
};

const CHART_TEMPLATE_NAMES: Record<number,string> = {
  1:"bar", 2:"line", 3:"pie", 4:"area", 5:"scatter", 6:"column", 7:"bubble"
};

export default function ViewPickerCard({
  projectId, insertAfterDatabaseId, onDone, isDark,
}: {
  projectId: string; insertAfterDatabaseId?: string | null; onDone: (createdDbId?: string) => void; isDark?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<ViewType>("table");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const { fetchDatabases, setActiveDatabase } = useWorkspaceStore();

  const createDbFromTemplate = async (templateId: number) => {
    if (creating) return;
    setCreating(true);

    const template = (TEMPLATES[selectedCategory] || []).find(t => t.id === templateId);
    if (!template) { setCreating(false); return; }

    let templateName = "blank";
    if (selectedCategory === "presentation")  templateName = templateId===1?"blank":templateId===2?"business":"product";
    else if (selectedCategory === "documentation") templateName = templateId===1?"blank":templateId===2?"resume":"report";
    else if (selectedCategory === "chart")    templateName = CHART_TEMPLATE_NAMES[templateId] || "bar";

    try {
      const res = await fetch("/api/databases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId, name: template.name,
          icon: OPTIONS.find(o => o.type === selectedCategory)?.icon || "📄",
          viewType: selectedCategory, templateName,
          insertAfterDatabaseId: insertAfterDatabaseId ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Status ${res.status}`);
      await fetchDatabases(projectId);
      if (data?._id) setActiveDatabase(data);
      onDone(data?._id);
    } catch (err) {
      console.error("Failed to create database:", err);
    } finally {
      setCreating(false);
    }
  };

  const templates = TEMPLATES[selectedCategory] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 md:p-6">
      <div className={`w-full max-w-7xl h-full sm:h-[90vh] overflow-hidden sm:rounded-2xl border shadow-2xl flex flex-col ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>

        <div className={`border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between ${isDark?"border-gray-800":"border-gray-200"}`}>
          <h1 className={`text-lg sm:text-2xl font-bold ${isDark?"text-white":"text-gray-900"}`}>Create a design</h1>
          <button onClick={() => onDone()} className={`p-2 rounded-lg transition-colors ${isDark?"hover:bg-gray-800 text-gray-400":"hover:bg-gray-100 text-gray-600"}`}>
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className={`hidden md:block w-48 lg:w-64 border-r overflow-y-auto ${isDark?"bg-gray-800 border-gray-700":"bg-gray-50 border-gray-200"}`}>
            <div className="p-3 lg:p-4 space-y-4 lg:space-y-5">
              <SidebarSection title="Dataset" isDark={isDark}>
                {OPTIONS.filter(o=>["table","board","timeline","gallery"].includes(o.type)).map(o=>(
                  <SidebarButton key={o.type} option={o} isActive={selectedCategory===o.type} isDark={isDark} onClick={()=>setSelectedCategory(o.type)}/>
                ))}
              </SidebarSection>
              {/* <SidebarSection title="Media & Collaboration" isDark={isDark}>
                {OPTIONS.filter(o=>["presentation"].includes(o.type)).map(o=>(
                  <SidebarButton key={o.type} option={o} isActive={selectedCategory===o.type} isDark={isDark} onClick={()=>setSelectedCategory(o.type)}/>
                ))}
              </SidebarSection> */}
              <SidebarSection title="Notes & Docs" isDark={isDark}>
                {OPTIONS.filter(o=>["editor","text","documentation","pagelink"].includes(o.type)).map(o=>(
                  <SidebarButton key={o.type} option={o} isActive={selectedCategory===o.type} isDark={isDark} onClick={()=>setSelectedCategory(o.type)}/>
                ))}
              </SidebarSection>
              <SidebarSection title="Charts & Data Viz" isDark={isDark}>
                {OPTIONS.filter(o=>["chart"].includes(o.type)).map(o=>(
                  <SidebarButton key={o.type} option={o} isActive={selectedCategory===o.type} isDark={isDark} onClick={()=>setSelectedCategory(o.type)}/>
                ))}
              </SidebarSection>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto ${isDark?"bg-gray-900":"bg-white"}`}>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <h2 className={`text-lg sm:text-xl font-bold mb-1 ${isDark?"text-white":"text-gray-900"}`}>
                  {OPTIONS.find(o=>o.type===selectedCategory)?.title} templates
                </h2>
                <p className={`text-xs sm:text-sm ${isDark?"text-gray-400":"text-gray-600"}`}>
                  {OPTIONS.find(o=>o.type===selectedCategory)?.desc}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {templates.map(template => (
                  <button key={template.id}
                    onClick={() => createDbFromTemplate(template.id)}
                    onMouseEnter={() => setSelectedTemplate(template.id)}
                    onMouseLeave={() => setSelectedTemplate(null)}
                    disabled={creating}
                    className={`group relative rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isDark?"border-gray-700 hover:border-teal-500":"border-gray-200 hover:border-blue-500"}`}
                    style={{ aspectRatio:"4/3" }}>
                    <div className={`absolute inset-0 p-3 sm:p-4 ${isDark?"bg-gradient-to-br from-gray-800 to-gray-900":"bg-gradient-to-br from-gray-50 to-gray-100"}`}>
                      <div className="h-full flex items-center justify-center">
                        {selectedCategory==="table"         && <TableTemplatePreview templateId={template.id}/>}
                        {selectedCategory==="board"         && <BoardTemplatePreview templateId={template.id}/>}
                        {selectedCategory==="timeline"      && <TimelineTemplatePreview templateId={template.id}/>}
                        {selectedCategory==="gallery"       && <GalleryTemplatePreview templateId={template.id}/>}
                        
                        {selectedCategory==="documentation" && <DocumentationTemplatePreview templateId={template.id}/>}
                        {selectedCategory==="presentation"  && <PresentationTemplatePreview templateId={template.id}/>}
                        
                        {selectedCategory==="chart"         && <ChartTemplatePreview templateId={template.id}/>}
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 backdrop-blur-sm p-3 sm:p-4 border-t ${isDark?"bg-gray-800/95 border-gray-700":"bg-white/95 border-gray-200"}`}>
                      <h3 className={`font-semibold text-xs sm:text-sm ${isDark?"text-white":"text-gray-900"}`}>{template.name}</h3>
                      <p className={`text-[10px] sm:text-xs mt-0.5 ${isDark?"text-gray-400":"text-gray-600"}`}>{template.desc}</p>
                    </div>
                    {selectedTemplate===template.id && !creating && (
                      <div className={`absolute inset-0 flex items-center justify-center ${isDark?"bg-teal-500/10":"bg-blue-500/10"}`}>
                        <div className={`px-4 py-2 rounded-lg font-medium text-white text-sm ${isDark?"bg-teal-500":"bg-blue-500"}`}>Create</div>
                      </div>
                    )}
                    {creating && selectedTemplate===template.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ title, isDark, children }: { title: string; isDark?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase mb-2 px-2 ${isDark?"text-gray-400":"text-gray-500"}`}>{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarButton({ option, isActive, isDark, onClick }: { option: { icon: string; title: string; desc: string }; isActive: boolean; isDark?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg text-left transition ${isActive ? isDark?"bg-gray-700 shadow-sm font-medium":"bg-white shadow-sm font-medium" : isDark?"hover:bg-gray-700":"hover:bg-gray-100"}`}>
      <span className="text-lg lg:text-xl">{option.icon}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-xs lg:text-sm font-medium truncate ${isDark?"text-white":"text-gray-900"}`}>{option.title}</div>
        <div className={`text-[10px] lg:text-xs truncate ${isDark?"text-gray-400":"text-gray-500"}`}>{option.desc}</div>
      </div>
    </button>
  );
}

// ── Preview components (keeping existing ones, adding ChartTemplatePreview) ──
function TableTemplatePreview({ templateId }: { templateId: number }) {
  return (
    <div className="w-full bg-white rounded-lg p-3 text-[10px]">
      <div className="grid grid-cols-3 gap-2 font-semibold text-gray-700"><div>Name</div><div>Status</div><div>Date</div></div>
      <div className="mt-2 space-y-1">{templateId===1?<><div className="h-5 bg-gray-100 rounded"/><div className="h-5 bg-gray-100 rounded"/></>:[1,2,3].map(i=><div key={i} className="grid grid-cols-3 gap-2"><div>Task {i}</div><div className="text-green-600">●</div><div>Feb {10+i}</div></div>)}</div>
    </div>
  );
}
function BoardTemplatePreview({ templateId }: { templateId: number }) {
  return (
    <div className="w-full grid grid-cols-3 gap-2 text-[9px]">
      {["Todo","Doing","Done"].map(col=>(
        <div key={col} className="rounded-md bg-white p-2">
          <div className="font-semibold text-gray-700">{col}</div>
          <div className="mt-2 space-y-1">{templateId===1?<div className="h-6 bg-gray-100 rounded"/>:<><div className="h-6 bg-blue-100 rounded"/><div className="h-6 bg-purple-100 rounded"/></>}</div>
        </div>
      ))}
    </div>
  );
}
function TimelineTemplatePreview({ templateId }: { templateId: number }) {
  return (
    <div className="w-full bg-white rounded-lg p-3">
      <div className="text-[9px] text-gray-500 mb-2">{templateId===1?"Empty":"Feb 2026"}</div>
      <div className="relative h-16">
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-300"/>
        {templateId>1&&<><div className="absolute top-1 left-2 right-1/2 h-5 bg-blue-200 rounded-sm text-[8px] flex items-center px-1">Task 1</div><div className="absolute top-7 left-8 right-1/3 h-5 bg-green-200 rounded-sm text-[8px] flex items-center px-1">Task 2</div></>}
      </div>
    </div>
  );
}
function GalleryTemplatePreview({ templateId }: { templateId: number }) {
  return (
    <div className="w-full grid grid-cols-3 gap-2">
      {[1,2,3].map(i=>(
        <div key={i} className="rounded-md bg-white overflow-hidden">
          <div className={`h-12 ${templateId===1?"bg-gray-100":"bg-gradient-to-br from-blue-100 to-purple-100"}`}/>
          <div className="p-1 text-[8px] font-semibold">{templateId===1?"":` Item ${i}`}</div>
        </div>
      ))}
    </div>
  );
}
function TodoTemplatePreview({ templateId }: { templateId: number }) {
  return (
    <div className="w-full bg-white rounded-lg p-3">
      <div className="space-y-2">{[1,2,3].map(i=>(
        <div key={i} className="flex items-center gap-2 text-[10px]">
          <div className="w-3 h-3 rounded border-2 border-gray-300"/>
          <div className="text-gray-700">{templateId===1?`Task ${i}`:`Daily ${i}`}</div>
        </div>
      ))}</div>
    </div>
  );
}
function GenericTemplatePreview({ type }: { type: string }) {
  const icons: Record<string,string> = { text:"📝", pagelink:"🔗" };
  return <div className="w-full bg-white rounded-lg p-4 flex items-center justify-center text-4xl">{icons[type]??"📄"}</div>;
}
function DocumentationTemplatePreview({ templateId }: { templateId: number }) {
  const labels = ["Blank Document","Resume / CV","Report"];
  return (
    <div className="w-full bg-white rounded-lg p-4 shadow-inner border border-gray-200">
      <div className="flex items-center gap-1.5 mb-3"><span className="text-xl">🧾</span><span className="text-[10px] font-bold text-gray-700">{labels[templateId-1]}</span></div>
      <div className="space-y-1.5">{[["60%",true],["100%",false],["80%",false]].map(([w,d],i)=>(
        <div key={i} className={`h-2 rounded-full ${d?"bg-gray-400":"bg-gray-200"}`} style={{width:w as string}}/>
      ))}</div>
    </div>
  );
}
function WhiteboardTemplatePreview({ templateId }: { templateId: number }) {
  const labels = ["Blank Canvas","Brainstorm","Wireframe"];
  return (
    <div className="w-full bg-white rounded-lg p-4 flex flex-col items-center justify-center border-2 border-gray-200">
      <div className="text-3xl mb-2">✏️</div>
      <div className="text-[10px] font-semibold">{labels[templateId-1]}</div>
    </div>
  );
}

// ✅ NEW — Chart template previews using mini SVG bars/lines
function ChartTemplatePreview({ templateId }: { templateId: number }) {
  const configs = [
    {
      label:"Bar Chart", icon:"📊", color:"from-blue-600 to-blue-400",
      preview: (
        <svg viewBox="0 0 80 50" className="w-full h-full">
          {[{x:5,h:30,c:"#60a5fa"},{x:18,h:20,c:"#60a5fa"},{x:31,h:40,c:"#60a5fa"},{x:44,h:25,c:"#60a5fa"},{x:57,h:35,c:"#60a5fa"},{x:70,h:15,c:"#60a5fa"}].map((b,i)=>(
            <rect key={i} x={b.x} y={50-b.h} width={10} height={b.h} fill={b.c} rx={1} opacity={0.9}/>
          ))}
          <line x1={0} y1={50} x2={80} y2={50} stroke="#374151" strokeWidth={0.5}/>
        </svg>
      ),
    },
    {
      label:"Line Chart", icon:"📈", color:"from-emerald-600 to-teal-400",
      preview: (
        <svg viewBox="0 0 80 50" className="w-full h-full">
          <polyline points="5,40 18,30 31,15 44,25 57,10 70,20" fill="none" stroke="#34d399" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          {[{x:5,y:40},{x:18,y:30},{x:31,y:15},{x:44,y:25},{x:57,y:10},{x:70,y:20}].map((p,i)=>(
            <circle key={i} cx={p.x} cy={p.y} r={2} fill="#34d399"/>
          ))}
          <line x1={0} y1={50} x2={80} y2={50} stroke="#374151" strokeWidth={0.5}/>
        </svg>
      ),
    },
    {
      label:"Pie Chart", icon:"🥧", color:"from-orange-500 to-yellow-400",
      preview: (
        <svg viewBox="0 0 80 60" className="w-full h-full">
          {/* Simple pie slices */}
          <circle cx={40} cy={32} r={22} fill="transparent" stroke="#3b82f6" strokeWidth={22} strokeDasharray="69 31" strokeDashoffset="0" transform="rotate(-90 40 32)"/>
          <circle cx={40} cy={32} r={22} fill="transparent" stroke="#10b981" strokeWidth={22} strokeDasharray="20 80" strokeDashoffset="-69" transform="rotate(-90 40 32)"/>
          <circle cx={40} cy={32} r={22} fill="transparent" stroke="#f59e0b" strokeWidth={22} strokeDasharray="11 89" strokeDashoffset="-89" transform="rotate(-90 40 32)"/>
          <circle cx={40} cy={32} r={10} fill="#1f2937"/>
        </svg>
      ),
    },
    {
      label:"Area Chart", icon:"📉", color:"from-violet-600 to-purple-400",
      preview: (
        <svg viewBox="0 0 80 50" className="w-full h-full">
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <polygon points="5,50 5,35 18,28 31,15 44,22 57,10 70,18 70,50" fill="url(#ag)"/>
          <polyline points="5,35 18,28 31,15 44,22 57,10 70,18" fill="none" stroke="#a78bfa" strokeWidth={1.5}/>
          <line x1={0} y1={50} x2={80} y2={50} stroke="#374151" strokeWidth={0.5}/>
        </svg>
      ),
    },
    {
      label:"Scatter Plot", icon:"🔵", color:"from-cyan-600 to-blue-400",
      preview: (
        <svg viewBox="0 0 80 50" className="w-full h-full">
          {[{x:12,y:35},{x:25,y:20},{x:18,y:42},{x:40,y:15},{x:55,y:30},{x:62,y:10},{x:35,y:38},{x:48,y:25},{x:70,y:20},{x:8,y:12}].map((p,i)=>(
            <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#06b6d4" opacity={0.8}/>
          ))}
          <line x1={0} y1={50} x2={80} y2={50} stroke="#374151" strokeWidth={0.5}/>
          <line x1={0} y1={0} x2={0} y2={50} stroke="#374151" strokeWidth={0.5}/>
        </svg>
      ),
    },
    {
      label:"Column Chart", icon:"📊", color:"from-rose-600 to-pink-400",
      preview: (
        <svg viewBox="0 0 80 50" className="w-full h-full">
          {[
            { x: 5, h: 38, w: 12 },
            { x: 20, h: 28, w: 12 },
            { x: 35, h: 42, w: 12 },
            { x: 50, h: 22, w: 12 },
            { x: 65, h: 35, w: 12 },
          ].map(({ x, h, w }, i) => (
            <rect key={i} x={x} y={50 - h} width={w} height={h} fill={`url(#cg${i})`} rx={1} />
          ))}
          <defs>
            {[0,1,2,3,4].map(i=>(
              <linearGradient key={i} id={`cg${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171"/>
                <stop offset="100%" stopColor="#fb923c"/>
              </linearGradient>
            ))}
          </defs>
          <line x1={0} y1={50} x2={80} y2={50} stroke="#374151" strokeWidth={0.5}/>
        </svg>
      ),
    },
    {
      label:"Bubble Chart", icon:"🌐", color:"from-teal-600 to-cyan-400",
      preview: (
        <svg viewBox="0 0 80 50" className="w-full h-full">
          {[{x:15,y:35,r:8,c:"#2dd4bf"},{x:40,y:20,r:12,c:"#06b6d4"},{x:62,y:30,r:6,c:"#3b82f6"},{x:28,y:12,r:5,c:"#8b5cf6"},{x:55,y:42,r:9,c:"#10b981"}].map((b,i)=>(
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={0.7}/>
          ))}
          <line x1={0} y1={50} x2={80} y2={50} stroke="#374151" strokeWidth={0.5}/>
          <line x1={0} y1={0} x2={0} y2={50} stroke="#374151" strokeWidth={0.5}/>
        </svg>
      ),
    },
  ];
  const c = configs[templateId-1] || configs[0];
  return (
    <div className={`w-full rounded-xl overflow-hidden bg-gradient-to-br ${c.color} p-0.5`}>
      <div className="w-full h-full bg-gray-950 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{c.icon}</span>
          <span className="text-[10px] font-bold text-white">{c.label}</span>
        </div>
        <div className="flex-1 min-h-0" style={{ height: 90 }}>
          {c.preview}
        </div>
      </div>
    </div>
  );
}

function PresentationTemplatePreview({ templateId }: { templateId: number }) {
  const labels = ["Blank Slides","Business Pitch","Product Demo"];
  return (
    <div className="w-full bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg p-4 flex flex-col items-center justify-center text-white">
      <div className="text-3xl mb-2">🎯</div>
      <div className="text-[10px] font-semibold text-center">{labels[templateId-1]}</div>
      <div className="mt-2 flex gap-1"><div className="w-8 h-6 bg-white/30 rounded-sm"/><div className="w-8 h-6 bg-white/20 rounded-sm"/></div>
    </div>
  );
}