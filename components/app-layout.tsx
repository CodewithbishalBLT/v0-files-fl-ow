"use client"

import { useState } from "react"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { PageContent } from "@/components/page-content"

export function AppLayout() {
  const [currentPage, setCurrentPage] = useState("files")

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNavigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 overflow-auto md:ml-16 lg:ml-0">
        <PageContent currentPage={currentPage} />
      </div>
    </div>
  )
}
