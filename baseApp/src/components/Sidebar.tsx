"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import { Button } from "./ui/button"
import { ThemeToggle } from "./ThemeToggle"
import { BarChart, Home, LogOut, Menu, User } from "lucide-react"

// Map of icon names to Lucide icons
const iconMap: Record<string, React.ElementType> = {
  home: Home,
  "bar-chart": BarChart,
  user: User,
}

export default function Sidebar() {
  const { config, currentUser, logout, projectId } = useApp()
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!config) return null

  // Filter pages based on user role and showInSidebar flag
  const sidebarPages = config.pages
    .filter((page) => page.showInSidebar)
    .filter((page) => !page.roleAccess || !currentUser || page.roleAccess.includes(currentUser.role))
    .sort((a, b) => (a.sidebarOrder || 0) - (b.sidebarOrder || 0))

  // Helper function to append project ID to path if it exists
  const getPathWithProjectId = (path: string) => {
    return projectId ? `${path}?id=${projectId}` : path
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center border-b px-4">
            <h1 className="text-lg font-semibold">{config.app.name}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-auto p-2">
            <ul className="space-y-1">
              {sidebarPages.map((page) => {
                const IconComponent = page.icon ? iconMap[page.icon] : Home
                const pathWithId = getPathWithProjectId(page.path)
                const isActive = location.pathname === page.path

                return (
                  <li key={page.id}>
                    <Link to={pathWithId}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                      >
                        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                        {page.title}
                      </Button>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t p-2">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                  <User className="h-4 w-4" />
                  <div className="flex-1 truncate text-sm">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-xs text-muted-foreground">{currentUser.role}</div>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">Not logged in</div>
            )}
            <div className="mt-2 flex justify-center">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </>
  )
}
