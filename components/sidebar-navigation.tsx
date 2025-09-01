"use client"

import { useState } from "react"
import { Upload, Code, ChevronLeft, ChevronRight, FileText, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarNavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function SidebarNavigation({ currentPage, onPageChange }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    {
      id: "files",
      label: "Upload Files",
      icon: Upload,
      description: "Share files securely with compression",
      badge: "20MB Max",
      color: "bg-green-500/10 text-green-600 border-green-200",
    },
    {
      id: "text",
      label: "Share Text/Code",
      icon: Code,
      description: "Send text and code snippets",
      badge: "Instant",
      color: "bg-green-500/10 text-green-600 border-green-200",
    },
  ]

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  const handleMobilePageChange = (page: string) => {
    onPageChange(page)
    setIsMobileMenuOpen(false)
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {isMobile && (
        <div className="flex justify-end p-4 border-b border-gray-100">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-6 flex-shrink-0 border-b border-gray-100">
        <div
          className={cn(
            "flex items-center gap-3 transition-all duration-300",
            !isMobile && isCollapsed && "justify-center",
          )}
        >
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          {(isMobile || !isCollapsed) && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">FilesFlow</h1>
              <p className="text-xs text-gray-500">Secure sharing</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <nav className="space-y-2">
          {(isMobile || !isCollapsed) && (
            <div className="px-2 mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pages</p>
            </div>
          )}

          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            const NavigationButton = (
              <button
                key={item.id}
                onClick={() => (isMobile ? handleMobilePageChange(item.id) : onPageChange(item.id))}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group",
                  "hover:bg-gray-50",
                  isActive && "bg-green-50 text-green-700 border border-green-200",
                  !isMobile && isCollapsed && "justify-center px-2",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-md transition-colors flex-shrink-0",
                    isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {(isMobile || !isCollapsed) && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-gray-900">{item.label}</div>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {item.badge}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                )}
              </button>
            )

            return !isMobile && isCollapsed ? (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{NavigationButton}</TooltipTrigger>
                <TooltipContent side="right">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              NavigationButton
            )
          })}
        </nav>
      </div>

      {(isMobile || !isCollapsed) && (
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Online • Compression enabled </span>
            </div>
            <Badge variant="outline" className="text-xs pl-1">
              v1.0
            </Badge>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 bg-white shadow-md border hover:shadow-lg transition-all duration-200"
        onClick={toggleMobileMenu}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleMobileMenu} />}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white z-50 transition-transform duration-300 ease-in-out w-80 shadow-xl md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-sm",
          "hidden md:block",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="absolute -right-3 top-6 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-white shadow-md border hover:shadow-lg transition-all duration-200"
                onClick={toggleCollapse}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>
        </div>

        <SidebarContent />
      </aside>
    </TooltipProvider>
  )
}
