"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { ThemeToggle } from "../../components/ThemeToggle"
import { Loader2, LogIn } from "lucide-react"

export default function LoginPage() {
  const { login, config, currentUser, loading, projectId } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      // Include project ID in navigation if available
      const dashboardPath = projectId ? `/dashboard?id=${projectId}` : "/dashboard"
      navigate(dashboardPath)
    }
  }, [currentUser, loading, navigate, projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const success = await login(email, password)
      if (success) {
        // Include project ID in navigation if available
        const dashboardPath = projectId ? `/dashboard?id=${projectId}` : "/dashboard"
        navigate(dashboardPath)
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("An error occurred during login")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = async (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
    setError(null)
    setIsSubmitting(true)

    try {
      const success = await login(email, password)
      if (success) {
        // Include project ID in navigation if available
        const dashboardPath = projectId ? `/dashboard?id=${projectId}` : "/dashboard"
        navigate(dashboardPath)
      } else {
        setError("Quick login failed. Please try manually.")
      }
    } catch (err) {
      setError("An error occurred during login")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render anything if we're redirecting
  if (loading || currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mt-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{config?.app.name || "Internal Tool"}</CardTitle>
          <CardDescription>Enter your credentials to sign in to your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            {config?.auth.users && (
              <div className="mt-6 rounded-md border p-4">
                <h3 className="mb-2 text-sm font-medium">Demo Accounts</h3>
                <div className="space-y-2">
                  {config.auth.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div className="flex-1">
                        <div className="font-medium">{user.role}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email} / {user.password}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickLogin(user.email, user.password)}
                        disabled={isSubmitting}
                      >
                        <LogIn className="mr-1 h-3 w-3" />
                        Login
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
