"use client"

import { useState } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import Sidebar from "@/components/Sidebar"

import data from "./data.json"

export default function Page() {
  const [view, setView] = useState("Dashboard")

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar view={view} setView={setView} />

      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
