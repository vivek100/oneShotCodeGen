"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Calendar, Users, ArrowRight } from "lucide-react"

interface Project {
  id: string
  name: string
  createdAt: string
  description?: string
  status?: string
  teamSize?: number
  lastUpdated?: string
}

export default function ProjectList({ projects = [] }: { projects?: Project[] }) {
  const [projectList, setProjectList] = useState<Project[]>([])
  
  // Ensure projects is an array and handle null/undefined
  useEffect(() => {
    setProjectList(Array.isArray(projects) ? projects : [])
  }, [projects])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Link href="/new-project">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectList.length > 0 ? (
          projectList.map((project) => (
            <Card key={project.id} className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{project.name}</CardTitle>
                  {project.status && (
                    <Badge
                      variant={
                        project.status === "active" ? "default" : project.status === "draft" ? "outline" : "secondary"
                      }
                      className={project.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                    >
                      {project.status}
                    </Badge>
                  )}
                </div>
                {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  {project.lastUpdated && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Updated: {new Date(project.lastUpdated).toLocaleDateString()}
                    </div>
                  )}
                  {project.teamSize && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Team size: {project.teamSize}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/projects/${project.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    Open Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        ) : (
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
