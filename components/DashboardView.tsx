// 'use client';

// import React from 'react';
// import { useTheme } from 'next-themes';
// import {
//       TrendingUp,
//       TrendingDown,
//       Users,
//       Briefcase,
//       CheckCircle2,
//       Clock,
//       MoreHorizontal,
//       ArrowUpRight,
//       ArrowDownRight,
//       MessageSquare,
// } from 'lucide-react';

// import FiltersBar from '@/components/FiltersBar';
// import LastProjects from '@/components/LastProjects';
// import TeamInsights from '@/components/TeamInsights';
// import Modal from '@/components/Modal';

// export default function DashboardView() {
//       const { resolvedTheme } = useTheme();
//       const isDark = resolvedTheme === 'dark';
//       const [selectedProject, setSelectedProject] = React.useState<any>(null);

//       // --- Mock Data ---
//       const projects = [
//             {
//                   id: 1,
//                   category: 'Design',
//                   type: 'Brand Strategy',
//                   title: 'Neon Branding System',
//                   description: 'Architecting a high-contrast visual identity for multi-platform distribution.',
//                   items: ['Visual Tokens', 'Asset Sync'],
//                   avatars: ['bg-amber-400', 'bg-indigo-500', 'bg-pink-500'],
//                   comments: 12,
//             },
//             {
//                   id: 2,
//                   category: 'Development',
//                   type: 'Dashboard UI',
//                   title: 'Core AI Interface',
//                   description: 'Engineering a reactive, glassmorphic command center for cluster management.',
//                   items: ['Real-time Hub', 'API Gateway'],
//                   avatars: ['bg-emerald-400', 'bg-sky-500', 'bg-fuchsia-500'],
//                   comments: 8,
//             },
//             {
//                   id: 3,
//                   category: 'Infrastructure',
//                   type: 'Edge Computing',
//                   title: 'Global Sync Module',
//                   description: 'Optimizing low-latency data replication across decentralized nodes.',
//                   items: ['Region Mesh', 'Packet Sharding'],
//                   avatars: ['bg-yellow-400', 'bg-purple-500'],
//                   comments: 15,
//             },
//       ];

//       const recentActivity = [
//             { id: 1, project: 'Core AI Interface', task: 'Prompt Engineering', status: 'Completed', time: '12m ago', user: 'Sarah' },
//             { id: 2, project: 'Neon Branding', task: 'Asset Hardening', status: 'In Progress', time: '45m ago', user: 'Mike' },
//             { id: 3, project: 'Global Sync', task: 'Cluster Handshake', status: 'Delayed', time: '1h ago', user: 'Anna' },
//             { id: 4, project: 'Neural Engine', task: 'Weights Refactor', status: 'In Progress', time: '3h ago', user: 'Tom' },
//       ];

//       return (
//             <div className="flex-1 overflow-y-auto p-6 space-y-6">


//                   {/* 1. Your projects section */}
//                   <div>
//                         <div className="flex items-center justify-between mb-4">
//                               <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
//                                     Your projects
//                               </h2>
//                               <button
//                                     className={`flex items-center gap-1 text-sm font-medium rounded-xl px-3 py-1.5 border transition-colors
//                                     ${isDark ? 'border-gray-800 text-gray-300 hover:bg-gray-900' : 'border-rose-200 text-gray-700 hover:bg-rose-50'}`}
//                               >
//                                     All Projects
//                                     <span className="text-xs">▾</span>
//                               </button>
//                         </div>

//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                               {projects.map((project) => (
//                                     <div
//                                           key={project.id}
//                                           onClick={() => setSelectedProject(project)}
//                                           className={`rounded-3xl border p-5 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer
//                                           ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-rose-50 border-rose-100'}`}
//                                     >
//                                           {/* Top badges */}
//                                           <div className="flex items-start justify-between mb-4">
//                                                 <div className="flex gap-2">
//                                                       <span
//                                                             className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-amber-500/10 text-amber-300"
//                                                       >
//                                                             {project.category}
//                                                       </span>
//                                                       <span
//                                                             className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-indigo-500/10 text-indigo-300"
//                                                       >
//                                                             {project.type}
//                                                       </span>
//                                                 </div>
//                                                 <button
//                                                       className={`p-1.5 rounded-full text-gray-500 hover:bg-white/5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
//                                                 >
//                                                       <MoreHorizontal size={16} />
//                                                 </button>
//                                           </div>

//                                           {/* Title & description */}
//                                           <div className="mb-4">
//                                                 <h3
//                                                       className={`text-base font-semibold mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'
//                                                             }`}
//                                                 >
//                                                       {project.title}
//                                                 </h3>
//                                                 <p
//                                                       className={`text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-600'
//                                                             }`}
//                                                 >
//                                                       {project.description}
//                                                 </p>
//                                           </div>

//                                           {/* Links list */}
//                                           <div className="mb-4 space-y-1 text-xs">
//                                                 {project.items.map((item) => (
//                                                       <div
//                                                             key={item}
//                                                             className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-800'
//                                                                   }`}
//                                                       >
//                                                             <span className="inline-block w-3 h-3 rounded-full border border-gray-500/40"></span>
//                                                             <span>{item}</span>
//                                                       </div>
//                                                 ))}
//                                           </div>

//                                           {/* Footer: avatars + comments */}
//                                           <div className="flex items-center justify-between pt-2">
//                                                 <div className="flex -space-x-2">
//                                                       {project.avatars.map((cls, idx) => (
//                                                             <div
//                                                                   key={idx}
//                                                                   className={`w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] text-white ${cls}`}
//                                                             >
//                                                                   {/* simple initials dot */}
//                                                             </div>
//                                                       ))}
//                                                 </div>
//                                                 <div
//                                                       className={`flex items-center gap-1 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'
//                                                             }`}
//                                                 >
//                                                       <MessageSquare size={14} />
//                                                       <span>{project.comments.toString().padStart(2, '0')}</span>
//                                                 </div>
//                                           </div>
//                                     </div>
//                               ))}
//                         </div>
//                   </div>

//                   {/* 2. Charts Section */}
//                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

//                         {/* Track Daily Task Progress (Bar Chart) */}
//                         <div
//                               className={`lg:col-span-2 p-6 rounded-3xl border flex flex-col ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100'
//                                     }`}
//                         >
//                               {/* Header */}
//                               <div className="flex items-start justify-between mb-8">
//                                     <div>
//                                           <h3
//                                                 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'
//                                                       }`}
//                                           >
//                                                 Track Daily Task Progress
//                                           </h3>
//                                           <p
//                                                 className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'
//                                                       }`}
//                                           >
//                                                 Overview of Daily Task Achievements
//                                           </p>
//                                     </div>

//                                     <div className="flex items-center gap-4">
//                                           {/* Legend */}
//                                           <div className="hidden sm:flex items-center gap-3 text-[11px]">
//                                                 <div className="flex items-center gap-1">
//                                                       <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
//                                                       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
//                                                             Task Done
//                                                       </span>
//                                                 </div>
//                                                 <div className="flex items-center gap-1">
//                                                       <span className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-white' : 'bg-slate-300'}`} />
//                                                       <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
//                                                             Task Target
//                                                       </span>
//                                                 </div>
//                                           </div>

//                                           {/* Range selector */}
//                                           <button
//                                                 className={`flex items-center gap-1 text-xs font-medium rounded-xl px-3 py-1.5 border transition-colors
//                                                 ${isDark
//                                                             ? 'border-gray-800 text-gray-200 bg-[#1F2937] hover:bg-gray-800'
//                                                             : 'border-rose-200 text-gray-700 hover:bg-rose-50'
//                                                       }`}
//                                           >
//                                                 Daily
//                                                 <span className="text-[10px]">▾</span>
//                                           </button>

//                                           <button className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
//                                                 <MoreHorizontal size={18} />
//                                           </button>
//                                     </div>
//                               </div>

//                               {/* Chart */}
//                               <div className="flex-1 relative min-h-[250px]">
//                                     {/* Y-axis grid lines */}
//                                     <div className="absolute inset-0 flex flex-col justify-between text-[10px] pointer-events-none z-0 pb-6">
//                                           {[100, 75, 50, 25, 0].map((val) => (
//                                                 <div key={val} className="flex items-center w-full">
//                                                       <span className={`w-6 text-right mr-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
//                                                             {val}
//                                                       </span>
//                                                       <div
//                                                             className={`flex-1 border-t ${isDark
//                                                                   ? 'border-gray-800'
//                                                                   : 'border-gray-100'
//                                                                   }`}
//                                                       />
//                                                 </div>
//                                           ))}
//                                     </div>

//                                     {/* Vertical Divider */}
//                                     <div className={`absolute top-0 bottom-8 left-[45%] w-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

//                                     {/* Week Labels */}
//                                     <div className="absolute top-4 left-9 right-0 flex text-xs font-medium text-gray-500">
//                                           <span className="w-[45%] text-center">Week 2</span>
//                                           <span className="w-[55%] text-center">Week 3</span>
//                                     </div>

//                                     {/* Bars Container */}
//                                     <div className="absolute inset-0 flex items-end pl-9 pb-0 pt-8">
//                                           {/* Week 2 Group */}
//                                           <div className="w-[45%] flex justify-around items-end px-2">
//                                                 {[
//                                                       { day: 'Mon', done: 65, target: 35 },
//                                                       { day: 'Tue', done: 45, target: 60 },
//                                                       { day: 'Fri', done: 45, target: 60 },
//                                                       { day: 'Sat', done: 45, target: 25 },
//                                                 ].map((item, idx) => (
//                                                       <div key={idx} className="flex flex-col items-center gap-3 w-full">
//                                                             <div className="flex items-end gap-1 h-40 sm:h-48 relative">
//                                                                   <div style={{ height: `${item.done}%` }} className="w-2 sm:w-3 bg-blue-600 rounded-sm"></div>
//                                                                   <div style={{ height: `${item.target}%` }} className={`w-2 sm:w-3 rounded-sm ${isDark ? 'bg-blue-100/90' : 'bg-slate-300'}`}></div>
//                                                             </div>
//                                                             <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.day}</span>
//                                                       </div>
//                                                 ))}
//                                           </div>

//                                           {/* Week 3 Group */}
//                                           <div className="w-[55%] flex justify-around items-end px-2">
//                                                 {[
//                                                       { day: 'Sun', done: 60, target: 30 },
//                                                       { day: 'Mon', done: 45, target: 55 },
//                                                       { day: 'Tue', done: 45, target: 70 },
//                                                       { day: 'Wed', done: 45, target: 85 },
//                                                       { day: 'Fri', done: 45, target: 55 },
//                                                 ].map((item, idx) => (
//                                                       <div key={idx} className="flex flex-col items-center gap-3 w-full">
//                                                             <div className="flex items-end gap-1 h-40 sm:h-48 relative">
//                                                                   <div style={{ height: `${item.done}%` }} className="w-2 sm:w-3 bg-blue-600 rounded-sm"></div>
//                                                                   <div style={{ height: `${item.target}%` }} className={`w-2 sm:w-3 rounded-sm ${isDark ? 'bg-blue-100/90' : 'bg-slate-300'}`}></div>
//                                                             </div>
//                                                             <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.day}</span>
//                                                       </div>
//                                                 ))}
//                                           </div>
//                                     </div>
//                               </div>
//                         </div>

//                         {/* Task Status (Pie Chart Mockup) */}
//                         <div className={`p-6 rounded-3xl border flex flex-col ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100'}`}>
//                               <h3 className={`text-lg font-semibold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Task Status</h3>

//                               <div className="flex-1 flex items-center justify-center relative">
//                                     {/* CSS-only Donut Chart */}
//                                     <div className="w-48 h-48 rounded-full border-[16px] border-indigo-500 relative flex items-center justify-center"
//                                           style={{
//                                                 borderRightColor: '#f472b6', // Pink
//                                                 borderBottomColor: '#10b981', // Green
//                                                 borderLeftColor: '#6366f1', // Indigo
//                                                 borderTopColor: '#6366f1', // Indigo
//                                                 transform: 'rotate(45deg)'
//                                           }}>
//                                           <div className={`absolute inset-0 rounded-full border-[16px] border-transparent`} style={{ transform: 'rotate(-45deg)' }}></div>
//                                     </div>
//                                     <div className="absolute text-center">
//                                           <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>85%</div>
//                                           <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Completion</div>
//                                     </div>
//                               </div>

//                               <div className="mt-8 space-y-3">
//                                     <div className="flex items-center justify-between text-sm">
//                                           <div className="flex items-center gap-2">
//                                                 <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
//                                                 <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>In Progress</span>
//                                           </div>
//                                           <span className="font-semibold">45%</span>
//                                     </div>
//                                     <div className="flex items-center justify-between text-sm">
//                                           <div className="flex items-center gap-2">
//                                                 <div className="w-3 h-3 rounded-full bg-pink-400"></div>
//                                                 <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Delayed</span>
//                                           </div>
//                                           <span className="font-semibold">25%</span>
//                                     </div>
//                                     <div className="flex items-center justify-between text-sm">
//                                           <div className="flex items-center gap-2">
//                                                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
//                                                 <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Completed</span>
//                                           </div>
//                                           <span className="font-semibold">30%</span>
//                                     </div>
//                               </div>
//                         </div>
//                   </div>

//                   {/* 3. Recent Activity Table */}
//                   <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100'}`}>
//                         <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
//                               <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
//                               <button className={`text-sm font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>View All</button>
//                         </div>
//                         <div className="overflow-x-auto">
//                               <table className="w-full text-sm text-left">
//                                     <thead className={`text-xs uppercase ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
//                                           <tr>
//                                                 <th className="px-6 py-4 font-medium">Project</th>
//                                                 <th className="px-6 py-4 font-medium">Task</th>
//                                                 <th className="px-6 py-4 font-medium">Status</th>
//                                                 <th className="px-6 py-4 font-medium">User</th>
//                                                 <th className="px-6 py-4 font-medium">Time</th>
//                                           </tr>
//                                     </thead>
//                                     <tbody>
//                                           {recentActivity.map((item) => (
//                                                 <tr key={item.id} className={`border-b last:border-0 transition-colors ${isDark ? 'border-gray-800 hover:bg-gray-800/30' : 'border-gray-100 hover:bg-gray-50'}`}>
//                                                       <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.project}</td>
//                                                       <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.task}</td>
//                                                       <td className="px-6 py-4">
//                                                             <span className={`px-2.5 py-1 rounded-full text-xs font-medium
//                                             ${item.status === 'Completed' ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') :
//                                                                         item.status === 'In Progress' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
//                                                                               (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')}`}>
//                                                                   {item.status}
//                                                             </span>
//                                                       </td>
//                                                       <td className="px-6 py-4">
//                                                             <div className="flex items-center gap-2">
//                                                                   <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
//                                                                         {item.user.charAt(0)}
//                                                                   </div>
//                                                                   <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.user}</span>
//                                                             </div>
//                                                       </td>
//                                                       <td className={`px-6 py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.time}</td>
//                                                 </tr>
//                                           ))}
//                                     </tbody>
//                               </table>
//                         </div>
//                   </div>
//                   {/* Top Section: Filters & Insights */}
//                   <div className="-mx-6 px-6">
//                         <FiltersBar />
//                   </div>

//                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//                         <LastProjects />
//                         <TeamInsights />
//                   </div>

//                   {/* Project Depth Modal */}
//                   <Modal
//                         isOpen={!!selectedProject}
//                         onClose={() => setSelectedProject(null)}
//                         title={selectedProject?.title || 'Project Details'}
//                         isDark={isDark}
//                   >
//                         {selectedProject && (
//                               <div className="space-y-8">
//                                     {/* Summary */}
//                                     <div className="flex items-center gap-4">
//                                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedProject.avatars[0]}`}>
//                                                 <Briefcase size={32} className="text-white" />
//                                           </div>
//                                           <div>
//                                                 <div className="text-lg font-bold">{selectedProject.title}</div>
//                                                 <div className="text-sm text-gray-500">{selectedProject.category} • {selectedProject.type}</div>
//                                           </div>
//                                     </div>

//                                     {/* Stats Grid */}
//                                     <div className="grid grid-cols-2 gap-4">
//                                           {[
//                                                 { label: 'Throughput', value: '4.2k ops/s', trend: 'up', color: 'text-emerald-500' },
//                                                 { label: 'Latency', value: '18ms', trend: 'down', color: 'text-blue-500' },
//                                                 { label: 'AI Confidence', value: '98.4%', trend: 'up', color: 'text-teal-500' },
//                                                 { label: 'Resource Load', value: '64%', trend: 'down', color: 'text-amber-500' },
//                                           ].map((stat, i) => (
//                                                 <div key={i} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-rose-50 border-rose-100'}`}>
//                                                       <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">{stat.label}</div>
//                                                       <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
//                                                       <div className="flex items-center gap-1 mt-1">
//                                                             {stat.trend === 'up' ? <ArrowUpRight size={12} className="text-emerald-500" /> : <ArrowDownRight size={12} className="text-blue-500" />}
//                                                             <span className="text-[10px] text-gray-400 capitalize">{stat.trend} trending</span>
//                                                       </div>
//                                                 </div>
//                                           ))}
//                                     </div>

//                                     {/* Recent Modules */}
//                                     <div className="space-y-3">
//                                           <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Modules</div>
//                                           {selectedProject.items.map((item: string, i: number) => (
//                                                 <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-rose-50 shadow-sm'}`}>
//                                                       <div className="w-2 h-2 rounded-full bg-teal-500"></div>
//                                                       <span className="text-sm font-medium">{item}</span>
//                                                       <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
//                                                             <Clock size={10} />
//                                                             <span>Running</span>
//                                                       </div>
//                                                 </div>
//                                           ))}
//                                     </div>

//                                     {/* Action */}
//                                     <button className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-teal-500/20 active:scale-95">
//                                           Launch Analysis Interface
//                                     </button>
//                               </div>
//                         )}
//                   </Modal>
//             </div>
//       );
// }\


import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import Sidebar from "./Sidebar"

// import data from "./data.json"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
      className="p-5"
    >
      {/* <AppSidebar variant="inset" /> */}
      
      <SidebarInset className=" border rounded-2xl">
        <SiteHeader />
        <div className="flex flex-1 flex-col ">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              {/* <DataTable data={data} /> */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

