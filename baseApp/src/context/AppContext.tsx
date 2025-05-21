"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { loadConfig } from "../lib/configLoader"
import { initMockApi } from "../lib/mockApi"
import type { AppConfig } from "../types/config"
//add search params
//add app api
import { getAppConfig } from "../lib/appApi"
type AppContextType = {
  config: AppConfig | null
  loading: boolean
  error: string | null
  currentUser: any | null
  projectId: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>
}

const AppContext = createContext<AppContextType>({
  config: null,
  loading: true,
  error: null,
  currentUser: null,
  projectId: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
})

export const useApp = () => useContext(AppContext)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Initialize the app
  useEffect(() => {
    const init = async () => {
      if (initialized) return

      try {
        //get project id from search params
        const urlProjectId = searchParams.get("id")
        const storedProjectId = localStorage.getItem("projectId")
        
        // Determine which project ID to use
        const activeProjectId = urlProjectId || storedProjectId || null
        
        // Update stored project ID if needed
        if (activeProjectId) {
          localStorage.setItem("projectId", activeProjectId)
          setProjectId(activeProjectId)
        }
        
        // Clear user auth if project ID has changed
        if (urlProjectId && storedProjectId !== urlProjectId) {
          localStorage.removeItem("currentUser")
          setCurrentUser(null)
        }

        // Load the configuration
        if (activeProjectId) {
          const appConfig = await getAppConfig(activeProjectId)
          setConfig(appConfig)
          // Initialize the mock API with the configuration
          initMockApi(appConfig)
        } else {
          const appConfig = await loadConfig()
          setConfig(appConfig)
          // Initialize the mock API with the configuration
          initMockApi(appConfig)
        }

        // Check if there's a stored session for this project
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("currentUser")
          if (storedUser) {
            setCurrentUser(JSON.parse(storedUser))
          }
        }

        setInitialized(true)
      } catch (err) {
        console.error("Failed to initialize app:", err)
        setError("Failed to load application configuration")
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [initialized, searchParams])

  // Handle automatic redirects based on auth state
  useEffect(() => {
    if (loading || !initialized) return

    const isAuthPage = location.pathname.startsWith("/auth/")

    // Don't redirect if we're already on an auth page or the root page
    if (isAuthPage || location.pathname === "/") return

    // If no user and not on an auth page, redirect to login
    if (!currentUser && !isAuthPage) {
      const redirectPath = projectId ? `/auth/login?id=${projectId}` : "/auth/login"
      navigate(redirectPath)
    }
  }, [currentUser, loading, location.pathname, navigate, initialized, projectId])

  const register = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    if (!config) return false

    // Check if email already exists
    const userExists = config.auth.users.some((u) => u.email === email)
    if (userExists) {
      return false
    }

    // Create a new user
    const newUser = {
      id: `${Date.now()}`,
      name,
      email,
      password,
      role,
    }

    // Add the user to the config
    config.auth.users.push(newUser)

    // Create a simplified user object without the password
    const loggedInUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    }

    setCurrentUser(loggedInUser)
    localStorage.setItem("currentUser", JSON.stringify(loggedInUser))
    return true
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!config) return false

    // Find the user in the config
    const user = config.auth.users.find((u) => u.email === email && u.password === password)

    if (user) {
      // Create a simplified user object without the password
      const loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }

      setCurrentUser(loggedInUser)
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser))
      return true
    }

    return false
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem("currentUser")
    // Keep project ID in params when redirecting to login
    const redirectPath = projectId ? `/auth/login?id=${projectId}` : "/auth/login"
    navigate(redirectPath)
  }

  return (
    <AppContext.Provider
      value={{
        config,
        loading,
        error,
        currentUser,
        projectId,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
