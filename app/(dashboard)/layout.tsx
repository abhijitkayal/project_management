import React from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* <Sidebar view="" setView={() => {}} /> */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
