// 'use client';

// import React from 'react';
// import { useTheme } from 'next-themes';
// import AppShell from '@/components/AppShell';
// import {
//     Calendar,
//     ChevronLeft,
//     ChevronRight,
//     Plus,
//     Clock,
//     User,
//     MapPin,
//     ListChecks
// } from 'lucide-react';

// // --- Mock Data ---
// const mockEvents = [
//     { time: '09:00', title: 'Daily Standup', location: 'Zoom', color: 'bg-teal-500' },
//     { time: '11:00', title: 'Design Review: V3 Mockups', location: 'Office Room 101', color: 'bg-rose-500' },
//     { time: '14:30', title: 'Client Sync-Up (High Priority)', location: 'Google Meet', color: 'bg-indigo-500' },
//     { time: '16:00', title: 'Focus Time (No interruptions)', location: 'Home', color: 'bg-gray-500' },
// ];

// const mockDays = [
//     { day: 'Mon', date: 2, isCurrent: false },
//     { day: 'Tue', date: 3, isCurrent: false },
//     { day: 'Wed', date: 4, isCurrent: false },
//     { day: 'Thu', date: 5, isCurrent: true }, // Today
//     { day: 'Fri', date: 6, isCurrent: false },
//     { day: 'Sat', date: 7, isCurrent: false },
//     { day: 'Sun', date: 8, isCurrent: false },
// ];

// // --- Event Card Component ---
// const EventCard: React.FC<any> = ({ event, isDark }) => {
//     const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
//     const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

//     return (
//         <div className={`p-4 rounded-xl border-l-4 ${event.color} ${cardBg} transition-shadow hover:shadow-lg`}>
//             <div className="flex justify-between items-start">
//                 <h4 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
//                 <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white`} style={{ backgroundColor: event.color.replace('bg-', '') }}>
//                     {event.time}
//                 </span>
//             </div>
            
//             <div className={`flex items-center gap-3 mt-2 text-xs ${textMuted}`}>
//                 <div className="flex items-center gap-1">
//                     <MapPin size={14} />
//                     <span>{event.location}</span>
//                 </div>
//             </div>
//         </div>
//     );
// };

// // --- Calendar Sidebar Component (Upcoming Events) ---
// const CalendarSidebar: React.FC<any> = ({ isDark }) => {
//     const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
//     const textPrimary = isDark ? 'text-white' : 'text-gray-900';
//     const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

//     return (
//         <div className={`w-[300px] shrink-0 p-6 rounded-3xl border ${cardBg} h-full sticky top-8 space-y-6`}>
//             <h3 className={`text-xl font-bold ${textPrimary}`}>Today's Agenda</h3>

//             {/* Events List */}
//             <div className="space-y-4">
//                 {mockEvents.map((event, index) => (
//                     <div key={index} className="flex gap-3 items-start">
//                         <span className={`text-sm font-semibold mt-1 ${textMuted}`}>{event.time}</span>
//                         <div className="flex-1">
//                             <h4 className={`text-sm font-semibold ${textPrimary}`}>{event.title}</h4>
//                             <p className={`text-xs ${textMuted}`}>{event.location}</p>
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             {/* Quick Actions */}
//             <div className="pt-4 border-t border-dashed">
//                 <h4 className={`font-semibold mb-3 ${textPrimary}`}>Quick Actions</h4>
//                 <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl text-white font-semibold bg-rose-600 hover:bg-rose-500 transition-colors shadow-md">
//                     <Plus size={16} /> New Event
//                 </button>
//             </div>
//         </div>
//     );
// };

// // --- Main Schedule View Component ---
// export function ScheduleView() {
//     const { resolvedTheme } = useTheme();
//     const isDark = resolvedTheme === 'dark';
//     const containerBg = isDark ? 'bg-slate-950' : 'bg-teal-50';
//     const weekDayBg = isDark ? 'bg-[#1F2125]' : 'bg-white';
//     const timeLineColor = isDark ? 'border-gray-800' : 'border-rose-100';
//     const hourLineColor = isDark ? 'border-gray-700' : 'border-gray-200';

//     // Generate time slots (8 AM to 6 PM)
//     const timeSlots = [];
//     for (let i = 8; i <= 18; i++) {
//         timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
//     }

//     return (
//         <div className={`flex-1 p-8 transition-colors ${containerBg} flex gap-8`}>
//             {/* Main Calendar Content (Day/Week View Simulation) */}
//             <div className="grow">
//                 {/* Header */}
//                 <div className="flex items-center justify-between mb-8">
//                     <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
//                         <Calendar size={32} className="text-teal-500" /> My Schedule
//                     </h1>
                    
//                     {/* Navigation */}
//                     <div className={`flex items-center border rounded-xl p-1 shadow-sm ${isDark ? 'border-gray-800' : 'border-rose-100'}`}>
//                         <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
//                             <ChevronLeft size={20} />
//                         </button>
//                         <span className={`px-4 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
//                             December 2025
//                         </span>
//                         <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
//                             <ChevronRight size={20} />
//                         </button>
//                     </div>
//                 </div>

//                 {/* Weekday Headers */}
//                 <div className={`grid grid-cols-8 sticky top-0 z-10 ${weekDayBg} border-b ${timeLineColor} rounded-t-xl shadow-md`}>
//                     {/* Empty corner for Time Column */}
//                     <div className={`h-12 border-r ${timeLineColor}`}></div> 
//                     {/* Days of the Week */}
//                     {mockDays.map((d, index) => (
//                         <div key={index} className={`flex flex-col items-center justify-center p-2 h-12 border-r ${timeLineColor} last:border-r-0`}>
//                             <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d.day}</span>
//                             <span className={`text-sm font-bold ${d.isCurrent ? 'text-rose-600 bg-rose-100 dark:bg-rose-800/50 p-1 rounded-full' : (isDark ? 'text-white' : 'text-gray-900')}`}>{d.date}</span>
//                         </div>
//                     ))}
//                 </div>

//                 {/* Calendar Grid - Time & Events */}
//                 <div className="relative border-x border-b rounded-b-xl overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
//                     {timeSlots.map((time, index) => (
//                         <div key={index} className={`grid grid-cols-8 h-20 border-b ${hourLineColor} last:border-b-0`}>
//                             {/* Time Column */}
//                             <div className={`flex justify-end pr-3 pt-1 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-700'} border-r ${timeLineColor}`}>
//                                 {time.slice(0, 5)}
//                             </div>
//                             {/* Daily Columns */}
//                             <div className={`col-span-7 grid grid-cols-7`}>
//                                 {mockDays.map((d, dayIndex) => (
//                                     <div key={dayIndex} className={`h-full border-r ${timeLineColor} transition-colors ${d.isCurrent ? (isDark ? 'bg-gray-900/10' : 'bg-rose-50') : ''}`}>
//                                         {/* Placeholder for events. A more complex system would absolutely position events here. */}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     ))}

//                     {/* Simulation of a Today Marker Line */}
//                     <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-20" style={{ top: 'calc(100% * 0.25)' }}>
//                         <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
//                     </div>
//                 </div>
//             </div>

//             {/* Sidebar for Today's Events and Quick Actions */}
//             <CalendarSidebar isDark={isDark} />
//         </div>
//     );
// }

// // Default export for the /schedule route
// export default function Page() {
//     return (
//         <AppShell defaultView="Schedule" activeMenu="schedule">
//             <ScheduleView />
//         </AppShell>
//     );
// }
'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import AppShell from '@/components/AppShell';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    User,
    MapPin,
    ListChecks,
    X,
    Menu
} from 'lucide-react';

// --- Mock Data ---
const mockEvents = [
    { time: '09:00', title: 'Daily Standup', location: 'Zoom', color: 'bg-teal-500' },
    { time: '11:00', title: 'Design Review: V3 Mockups', location: 'Office Room 101', color: 'bg-rose-500' },
    { time: '14:30', title: 'Client Sync-Up (High Priority)', location: 'Google Meet', color: 'bg-indigo-500' },
    { time: '16:00', title: 'Focus Time (No interruptions)', location: 'Home', color: 'bg-gray-500' },
];

const mockDays = [
    { day: 'Mon', date: 2, isCurrent: false },
    { day: 'Tue', date: 3, isCurrent: false },
    { day: 'Wed', date: 4, isCurrent: false },
    { day: 'Thu', date: 5, isCurrent: true }, // Today
    { day: 'Fri', date: 6, isCurrent: false },
    { day: 'Sat', date: 7, isCurrent: false },
    { day: 'Sun', date: 8, isCurrent: false },
];

// --- Event Card Component ---
const EventCard: React.FC<any> = ({ event, isDark }) => {
    const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    return (
        <div className={`p-3 sm:p-4 rounded-xl border-l-4 ${event.color} ${cardBg} transition-shadow hover:shadow-lg`}>
            <div className="flex justify-between items-start gap-2">
                <h4 className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{event.title}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap`} style={{ backgroundColor: event.color.replace('bg-', '') }}>
                    {event.time}
                </span>
            </div>
            
            <div className={`flex items-center gap-3 mt-2 text-xs ${textMuted}`}>
                <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{event.location}</span>
                </div>
            </div>
        </div>
    );
};

// --- Calendar Sidebar Component (Upcoming Events) ---
const CalendarSidebar: React.FC<any> = ({ isDark, isOpen, onClose }) => {
    const cardBg = isDark ? 'bg-[#1F2125] border-gray-800' : 'bg-white border-rose-100';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:sticky top-0 right-0 h-full lg:h-auto
                w-[280px] sm:w-[300px] lg:w-[300px] 
                shrink-0 p-4 sm:p-6 rounded-none lg:rounded-3xl 
                border-l lg:border ${cardBg} 
                lg:top-8 space-y-4 sm:space-y-6 
                z-50 lg:z-auto
                transform transition-transform duration-300
                ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                overflow-y-auto
            `}>
                {/* Mobile Close Button */}
                <div className="flex items-center justify-between lg:hidden mb-4">
                    <h3 className={`text-lg font-bold ${textPrimary}`}>Today's Agenda</h3>
                    <button 
                        onClick={onClose}
                        className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                        <X size={20} className={textMuted} />
                    </button>
                </div>

                {/* Desktop Title */}
                <h3 className={`hidden lg:block text-xl font-bold ${textPrimary}`}>Today's Agenda</h3>

                {/* Events List */}
                <div className="space-y-3 sm:space-y-4">
                    {mockEvents.map((event, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <span className={`text-xs sm:text-sm font-semibold mt-1 ${textMuted} whitespace-nowrap`}>{event.time}</span>
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold ${textPrimary} truncate`}>{event.title}</h4>
                                <p className={`text-xs ${textMuted} truncate`}>{event.location}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <h4 className={`font-semibold mb-3 text-sm sm:text-base ${textPrimary}`}>Quick Actions</h4>
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-xl text-white font-semibold bg-rose-600 hover:bg-rose-500 transition-colors shadow-md">
                        <Plus size={16} /> New Event
                    </button>
                </div>
            </div>
        </>
    );
};

// --- Main Schedule View Component ---
export function ScheduleView() {
    const { resolvedTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isDark = resolvedTheme === 'dark';
    const containerBg = isDark ? 'bg-slate-950' : 'bg-teal-50';
    const weekDayBg = isDark ? 'bg-[#1F2125]' : 'bg-white';
    const timeLineColor = isDark ? 'border-gray-800' : 'border-rose-100';
    const hourLineColor = isDark ? 'border-gray-700' : 'border-gray-200';

    // Generate time slots (8 AM to 6 PM)
    const timeSlots = [];
    for (let i = 8; i <= 18; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    }

    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors ${containerBg} flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8`}>
            {/* Main Calendar Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <h1 className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <Calendar size={28} className="text-teal-500 sm:w-8 sm:h-8" /> My Schedule
                    </h1>
                    
                    {/* Navigation & Mobile Menu Button */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className={`flex items-center border rounded-xl p-1 shadow-sm flex-1 sm:flex-initial ${isDark ? 'border-gray-800' : 'border-rose-100'}`}>
                            <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                            </button>
                            <span className={`px-2 sm:px-4 text-sm sm:text-base font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Dec 2025
                            </span>
                            <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Mobile Sidebar Toggle */}
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className={`lg:hidden p-2 rounded-xl border ${isDark ? 'border-gray-800 bg-[#1F2125] text-gray-400' : 'border-rose-100 bg-white text-gray-700'}`}
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </div>

                {/* Mobile: Show today's events as cards above calendar */}
                <div className="lg:hidden mb-6 space-y-3">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Today's Events</h3>
                    {mockEvents.map((event, index) => (
                        <EventCard key={index} event={event} isDark={isDark} />
                    ))}
                </div>

                {/* Calendar Grid Container - Horizontal Scroll on Mobile */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-[640px] px-4 sm:px-0">
                        {/* Weekday Headers */}
                        <div className={`grid grid-cols-8 sticky top-0 z-10 ${weekDayBg} border-b ${timeLineColor} rounded-t-xl shadow-md`}>
                            {/* Empty corner for Time Column */}
                            <div className={`h-10 sm:h-12 border-r ${timeLineColor} flex items-center justify-center`}>
                                <Clock size={16} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                            </div> 
                            {/* Days of the Week */}
                            {mockDays.map((d, index) => (
                                <div key={index} className={`flex flex-col items-center justify-center p-2 h-10 sm:h-12 border-r ${timeLineColor} last:border-r-0`}>
                                    <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{d.day}</span>
                                    <span className={`text-xs sm:text-sm font-bold ${d.isCurrent ? 'text-rose-600 bg-rose-100 dark:bg-rose-800/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full' : (isDark ? 'text-white' : 'text-gray-900')}`}>{d.date}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid - Time & Events */}
                        <div className={`relative border-x border-b rounded-b-xl overflow-hidden ${isDark ? 'bg-[#0F1014]' : 'bg-white'}`} style={{ height: '500px' }}>
                            <div className="overflow-y-auto h-full">
                                {timeSlots.map((time, index) => (
                                    <div key={index} className={`grid grid-cols-8 h-16 sm:h-20 border-b ${hourLineColor} last:border-b-0`}>
                                        {/* Time Column */}
                                        <div className={`flex justify-end pr-2 sm:pr-3 pt-1 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-700'} border-r ${timeLineColor}`}>
                                            {time.slice(0, 5)}
                                        </div>
                                        {/* Daily Columns */}
                                        <div className={`col-span-7 grid grid-cols-7`}>
                                            {mockDays.map((d, dayIndex) => (
                                                <div key={dayIndex} className={`h-full border-r ${timeLineColor} last:border-r-0 transition-colors hover:bg-opacity-50 ${d.isCurrent ? (isDark ? 'bg-gray-900/20' : 'bg-rose-50') : (isDark ? 'hover:bg-gray-900/10' : 'hover:bg-gray-50')}`}>
                                                    {/* Placeholder for events */}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Simulation of a Today Marker Line */}
                            <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none" style={{ top: 'calc(100% * 0.25)' }}>
                                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Hint */}
                <p className={`text-xs text-center mt-4 sm:hidden ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Swipe left/right to view more days
                </p>
            </div>

            {/* Sidebar for Today's Events and Quick Actions */}
            <CalendarSidebar 
                isDark={isDark} 
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
        </div>
    );
}

// Default export for the /schedule route
export default function Page() {
    return (
        <AppShell defaultView="Schedule" activeMenu="schedule">
            <ScheduleView />
        </AppShell>
    );
}