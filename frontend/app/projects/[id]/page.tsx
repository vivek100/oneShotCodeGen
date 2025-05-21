import { getAppConfig, getMessages } from "@/api/api"
import ProjectWorkspace from "@/components/projects/project-workspace"

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const appConfig = await getAppConfig(params.id)
  const messages = await getMessages(params.id)
  console.log("App Config:", appConfig);
  return <ProjectWorkspace projectId={params.id} initialAppConfig={appConfig} initialMessages={messages} />
}
