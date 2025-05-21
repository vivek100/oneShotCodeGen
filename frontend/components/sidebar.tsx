"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Settings,
  PlusCircle,
  Terminal,
  Sun,
  Moon,
  Github,
  Star,
} from "lucide-react"
import { getProjects } from "@/api/api"
import { useTheme } from "next-themes"
import { useAuth } from '@/contexts/AuthContext'
import { UserProfileButton } from "@/components/UserProfileButton"
import { trackEvent } from "@/lib/mixpanelClient"
import { TrackingStatusBadge } from "@/components/tracking-status"

export default function Sidebar() {
  const pathname = usePathname()
  const [projects, setProjects] = useState<any[]>([])
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [starCount, setStarCount] = useState<number | null>(null)
  const [isStarLoading, setIsStarLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(() => {
    // Check localStorage for saved state
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed")
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  const { user, isCloudMode } = useAuth()
  
  // Show limited sidebar for unauthenticated users in cloud mode
  const showLimitedSidebar = isCloudMode && !user

  // Function to fetch GitHub star count
  useEffect(() => {
    const fetchStarCount = async () => {
      setIsStarLoading(true)
      try {
        const response = await fetch('https://api.github.com/repos/vivek100/oneShotCodeGen')
        if (response.ok) {
          const data = await response.json()
          setStarCount(data.stargazers_count)
        }
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error)
      } finally {
        setIsStarLoading(false)
      }
    }
    
    fetchStarCount()
  }, [])

  // Function to load projects
  const loadProjects = useCallback(async () => {
    try {
      // Always load projects regardless of auth status
      const projectsData = await getProjects()
      // Ensure projectsData is an array
      setProjects(Array.isArray(projectsData) ? projectsData : [])
    } catch (error) {
      console.error("Failed to load projects:", error)
      setProjects([]) // Set empty array on error
    }
  }, [])

  // Initial load of projects
  useEffect(() => {
    loadProjects()
  }, [loadProjects, user]) // Add user as dependency to reload when auth state changes

  // Listen for flow status change events
  useEffect(() => {
    const handleFlowStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent
      const { isRunning } = customEvent.detail || {}
      
      // Only reload projects when flow is done running (isRunning is false)
      if (isRunning === false) {
        console.log("Flow completed, reloading project list")
        loadProjects()
      }
    }

    // Add event listener
    window.addEventListener("flow-status-changed", handleFlowStatusChanged)

    // Cleanup function
    return () => {
      window.removeEventListener("flow-status-changed", handleFlowStatusChanged)
    }
  }, [loadProjects])

  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", JSON.stringify(newState))
    }
    
    // Track sidebar collapse/expand action
    trackEvent("Sidebar Toggle", { collapsed: newState });
  }

  // Track project selection
  const handleProjectClick = (project: any) => {
    trackEvent("Project Selected", { 
      projectId: project.id,
      projectName: project.name
    });
  }

  // Filter nav items based on auth status and cloud mode
  const getFilteredNavItems = () => {
    const baseItems = [
      {
        name: "Projects",
        href: "/projects",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        name: "Agent Flow Editor",
        href: "/admin/flows",
        icon: <GitBranch className="h-5 w-5" />,
      }
    ]

    // Flow Editor is only visible in open source mode or when not in cloud mode
    const flowEditorItem = {
      name: "Agent Flow Editor",
      href: "/admin/flows",
      icon: <GitBranch className="h-5 w-5" />,
    }
    // Settings is only visible in open source mode
    const settingsItem = {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    }
    // In cloud mode:
    // - For non-authenticated users: show nothing in nav
    // - For authenticated users: show Projects and Settings, but not Flow Editor
    // In open source mode: show all items including Flow Editor
    
    if (isCloudMode) {
      if (!user) {
        return [] // Show no nav items for non-authenticated users in cloud mode
      }
      return baseItems // Show base items (without Flow Editor) for authenticated users in cloud mode
    }
    
    // Open source mode - show all items
    return [...baseItems, flowEditorItem, settingsItem]
  }

  const navItems = getFilteredNavItems()

  const toggleProjects = (e: React.MouseEvent) => {
    e.preventDefault()
    setProjectsOpen(!projectsOpen)
  }

  return (
    <div
      className={cn(
        "bg-slate-50 dark:bg-slate-900 h-screen flex flex-col border-r transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b bg-primary dark:bg-transparent">
        {!collapsed ? (
          <div className="flex items-center w-full">
            <h1 className="font-bold text-xl text-white dark:text-primary">
              <span className="flex items-center">
                <Terminal className="h-5 w-5 mr-2 text-white dark:text-primary" />
                OneShotCodeGen
              </span>
            </h1>
          </div>
        ) : (
          <Terminal className="h-6 w-6 text-white dark:text-primary mx-auto" />
        )}
      </div>

      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapse} 
          className="absolute right-0 translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border shadow-sm h-8 w-8 p-0 z-10 rounded-full"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 py-4">
        {/* GitHub repo button - always visible to all users */}
        {/* TODO: Add dark and light mode support for the button */}
        <div className="px-2 mb-4">
          <a
            href="https://github.com/vivek100/oneShotCodeGen"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
            )}
            onClick={() => trackEvent("GitHub Link Clicked")}
          >
            <div className={cn(
              "flex items-center",
              !collapsed && "bg-zinc-900 dark:bg-zinc-900 text-white hover:bg-zinc-800 dark:hover:bg-zinc-800 rounded-md overflow-hidden border border-zinc-700 dark:border-zinc-700"
            )}>
              {collapsed ? (
                <div className="bg-zinc-900 dark:bg-zinc-900 p-1.5 rounded-md">
                  <Github className="h-5 w-5 text-white" />
                </div>
              ) : (
                <>
                  <div className="bg-zinc-900 dark:bg-zinc-900 px-2 py-1.5 flex items-center">
                    <Github className="h-4 w-4 text-white" />
                    <span className="ml-1.5 text-white">GitHub</span>
                  </div>
                  
                  <div className="bg-zinc-800 dark:bg-zinc-800 px-2 py-1.5 border-l border-zinc-700 dark:border-zinc-700 flex items-center min-w-[60px] justify-center">
                    {isStarLoading ? (
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full border-2 border-zinc-600 border-t-yellow-500 animate-spin"></div>
                      </div>
                    ) : starCount !== null && (
                      <>
                        <Star className="h-3.5 w-3.5 text-yellow-500 mr-1 fill-current" />
                        <span className="text-white">{starCount?.toLocaleString()}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </a>
        </div>

        {/* Only show navigation items if we have items to display */}
        {navItems.length > 0 && (
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href || (item.href === "/projects" && pathname.startsWith("/projects"))
                      ? "bg-primary/10 text-black dark:bg-primary/20 dark:text-primary"
                      : "hover:bg-slate-100 hover:text-black dark:hover:bg-slate-800 dark:hover:text-primary",
                    collapsed && "justify-center px-0",
                  )}
                  onClick={() => trackEvent("Navigation Clicked", { name: item.name })}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Recent Projects section - visible to all users */}
        {!collapsed && (
          <div className="mt-6 px-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Recent Projects
            </div>
            <ul className="space-y-1">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === `/projects/${project.id}`
                        ? "bg-primary/10 text-black dark:bg-primary/20 dark:text-primary"
                        : "hover:bg-slate-100 hover:text-black dark:hover:bg-slate-800 dark:hover:text-primary",
                    )}
                    onClick={() => handleProjectClick(project)}
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
              {projects.length === 0 && (
                <li className="text-sm text-slate-500 dark:text-slate-400 px-3 py-2">
                  No projects yet
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Always show New Project button */}
        {!collapsed ? (
          <div className="px-3 mt-2">
            <Link
              href="/new-project"
              className="flex items-center rounded-md px-3 py-2 text-sm text-black dark:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => trackEvent("New Project Button Clicked")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </div>
        ) : (
          <div className="px-2 mt-2">
            <Link
              href="/new-project"
              className="flex items-center justify-center rounded-md p-2 text-sm text-black dark:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => trackEvent("New Project Button Clicked")}
            >
              <PlusCircle className="h-5 w-5" />
            </Link>
          </div>
        )}
      </nav>
      
      {/* Footer section with UserProfileButton above theme toggle */}
      <div className="mt-auto p-4 border-t">
        {!collapsed ? (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account</span>
              <UserProfileButton />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UserProfileButton iconOnly />
            <ThemeToggle iconOnly />
          </div>
        )}
      </div>
    </div>
  )
}

export function ThemeToggle({ iconOnly = false }: { iconOnly?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // only after mount we can trust theme value
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    trackEvent("Theme Changed", { theme: newTheme });
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size={iconOnly ? "icon" : "default"} disabled className={iconOnly ? "h-8 w-8" : "h-8"}>
        {/* Optional: show a spinner or placeholder if you want */}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "default"}
      onClick={handleThemeChange}
      className={iconOnly ? "h-8 w-8" : "h-8"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Light</span>}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {!iconOnly && <span className="ml-2">Dark</span>}
        </>
      )}
    </Button>
  );
}