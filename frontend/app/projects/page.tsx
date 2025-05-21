import ProjectList from "@/components/projects/project-list"
import { getProjects } from "@/api/api"

export default async function ProjectsPage() {
  const projects = await getProjects() || []

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <ProjectList projects={projects} />
    </div>
  )
}
