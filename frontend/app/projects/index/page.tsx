import Link from "next/link"
import { getProjects } from "@/api/api"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowRight } from "lucide-react"

export default async function ProjectsIndexPage() {
  const projects = await getProjects() || []  // Ensure projects is an array

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link href="/new-project">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(projects) && projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" size="sm">
                  Open Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {(!Array.isArray(projects) || projects.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
            <p className="text-muted-foreground mb-4">No projects found</p>
            <Link href="/new-project">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
