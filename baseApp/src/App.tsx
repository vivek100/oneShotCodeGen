import { Routes, Route, Navigate } from "react-router-dom"
import { useApp } from "./context/AppContext"
import LoginPage from "./pages/auth/LoginPage"
import RegisterPage from "./pages/auth/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import DynamicPage from "./pages/DynamicPage"
import { Loader2 } from "lucide-react"

function App() {
  const { currentUser, loading, projectId } = useApp()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading application...</span>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* Protected routes */}
      {currentUser ? (
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/:slug/*" element={<DynamicPage />} />
          <Route 
            path="/" 
            element={
              <Navigate 
                to={projectId ? `/dashboard?id=${projectId}` : "/dashboard"} 
                replace 
              />
            } 
          />
        </>
      ) : (
        <Route 
          path="*" 
          element={
            <Navigate 
              to={projectId ? `/auth/login?id=${projectId}` : "/auth/login"} 
              replace 
            />
          } 
        />
      )}
    </Routes>
  )
}

export default App
