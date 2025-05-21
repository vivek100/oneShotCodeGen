import { getFlows } from "@/api/api"
import FlowEditor from "@/components/flows/flow-editor"

export default async function FlowsPage() {
  const flows = await getFlows()

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Agent Flow Editor</h1>
      <FlowEditor initialFlows={flows} />
    </div>
  )
}
