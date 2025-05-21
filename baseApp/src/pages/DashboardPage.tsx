import { useApp } from "../context/AppContext"
import Sidebar from "../components/Sidebar"
import ComponentFactory from "../components/ComponentFactory"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { config, loading } = useApp()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
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

  const dashboardPage = config?.pages.find((page) => page.path === "/dashboard")

  if (!dashboardPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Dashboard not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">
        <h1 className="mb-6 text-2xl font-bold">{dashboardPage.title}</h1>

        {dashboardPage.zones.map((zone) => (
            <div key={zone.name} className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-muted-foreground">{zone.name}</h2>
              <div className={`grid gap-4 ${getGridClass(zone.components.length)}`}>
                {zone.components.map((component: any, index: number) => (
                  <ComponentFactory key={`${zone.name}-${index}`} type={component.type} props={component.props} />
                ))}
              </div>
            </div>
        ))}
      </main>
    </div>
  )
}
