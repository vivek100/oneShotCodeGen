import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAppConfig } from "@/api/api"

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: { project_id?: string }
}) {
  const projectId = searchParams.project_id || "p1"
  const appConfig = await getAppConfig(projectId)

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            {appConfig.app.name}
            <Badge variant="outline" className="ml-2">
              Preview
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{appConfig.app.description}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {appConfig.pages[0].zones[0].components.map((component: any, index: number) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{component.props.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{component.props.title === "Total Employees" ? "2" : "3"}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Department</th>
                </tr>
              </thead>
              <tbody>
                {appConfig.resources.employees.data.map((employee: any) => {
                  const department = appConfig.resources.departments.data.find(
                    (d: any) => d.id === employee.department_id,
                  )
                  return (
                    <tr key={employee.id} className="border-t">
                      <td className="p-2">{employee.name}</td>
                      <td className="p-2">{employee.email}</td>
                      <td className="p-2">{department?.name}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
