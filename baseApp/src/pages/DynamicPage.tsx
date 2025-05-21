"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useApp } from "../context/AppContext"
import Sidebar from "../components/Sidebar"
import ComponentFactory from "../components/ComponentFactory"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>()
  const { config, loading, currentUser } = useApp()
  const [page, setPage] = useState<any | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!config || loading) return

    // Construct the path from the slug
    const path = `/${slug}`

    // Find the page that matches the current path
    const matchedPage = config.pages.find((p) => p.path === path)

    if (!matchedPage) {
      setPage(null)
      return
    }

    // Check if the user has access to this page
    if (matchedPage.roleAccess && currentUser) {
      if (!matchedPage.roleAccess.includes(currentUser.role)) {
        setAccessDenied(true)
        return
      }
    }

    setPage(matchedPage)
  }, [config, slug, loading, currentUser])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading page...</span>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested page could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Helper function to determine grid columns based on component count
  const getGridClass = (componentCount: number) => {
    switch (componentCount) {
      case 1:
        return "grid-cols-1" // Full width for a single component
      case 2:
        return "grid-cols-1 md:grid-cols-2" // Two equal columns on medium screens and up
      case 3:
        return "grid-cols-1 md:grid-cols-3" // Three equal columns on medium screens and up
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" // Two columns on medium, four on large
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" // Responsive grid for 5+ components
    }
  }

  // Render the page based on its layout type
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">{page.title}</h1>

        {page.layoutType === "tabs" && page.zones.length > 0 ? (
          <Tabs defaultValue={page.zones[0].name}>
            <TabsList>
              {page.zones.map((zone: any) => (
                <TabsTrigger key={zone.name} value={zone.name}>
                  {zone.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {page.zones.map((zone: any) => (
              <TabsContent key={zone.name} value={zone.name} className="space-y-4">
                <div className={`grid gap-4 ${getGridClass(zone.components.length)}`}>
                  {zone.components.map((component: any, index: number) => (
                    <ComponentFactory key={`${zone.name}-${index}`} type={component.type} props={component.props} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          page.zones.map((zone: any) => (
            <div key={zone.name} className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-muted-foreground">{zone.name}</h2>
              <div className={`grid gap-4 ${getGridClass(zone.components.length)}`}>
                {zone.components.map((component: any, index: number) => (
                  <ComponentFactory key={`${zone.name}-${index}`} type={component.type} props={component.props} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
