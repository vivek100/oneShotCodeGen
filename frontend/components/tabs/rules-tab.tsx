import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, AlertTriangle } from "lucide-react"

interface RulesTabProps {
  appConfig: any
}

export default function RulesTab({ appConfig }: RulesTabProps) {
  const hasPages = appConfig.pages && appConfig.pages.length > 0
  const hasRoles = appConfig.auth?.roles && appConfig.auth.roles.length > 0
  const hasResources = appConfig.resources && Object.keys(appConfig.resources).length > 0
  
  const isEmptyState = !hasPages && !hasRoles && !hasResources

  const renderPageRbacTable = () => {
    const pages = appConfig.pages || []
    const allRoles = appConfig.auth?.roles || []
    
    if (pages.length === 0 || allRoles.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No page access rules defined yet.</p>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Path</TableHead>
            {allRoles.map((role: string) => (
              <TableHead key={role}>{role}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page: any) => (
            <TableRow key={page.id}>
              <TableCell className="font-medium">{page.title}</TableCell>
              <TableCell>{page.path}</TableCell>
              {allRoles.map((role: string) => (
                <TableCell key={`${page.id}-${role}`}>
                  {page.roleAccess && page.roleAccess.includes(role) ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const renderResourcePermissions = () => {
    const resources = appConfig.resources || {}
    const resourceNames = Object.keys(resources)
    
    if (resourceNames.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No resource permissions defined yet.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {resourceNames.map((resourceName) => {
          const resource = resources[resourceName]
          const permissions = resource.permissions || {}
          const roles = Object.keys(permissions)
          const actions = resource.actions || []

          return (
            <Card key={resourceName} className="overflow-hidden">
              <CardHeader className="bg-muted">
                <CardTitle className="text-lg">{resourceName}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      {actions.map((action: string) => (
                        <TableHead key={action}>{action}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={`${resourceName}-${role}`}>
                        <TableCell className="font-medium">{role}</TableCell>
                        {actions.map((action: string) => (
                          <TableCell key={`${resourceName}-${role}-${action}`}>
                            {permissions[role].includes("*") || permissions[role].includes(action) ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (isEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Rules Defined</h2>
        <p className="text-muted-foreground max-w-md">
          Your application doesn't have any rules defined yet. Rules control access permissions and behavior of your application.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Access Control</CardTitle>
        </CardHeader>
        <CardContent>{renderPageRbacTable()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Resource Permissions</CardTitle>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>{renderResourcePermissions()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Hooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <Badge variant="outline" className="mb-2">
              Coming Soon
            </Badge>
            <p className="text-muted-foreground">
              Lifecycle hooks will allow you to define custom logic that runs before or after certain actions, such as
              data validation, transformation, or triggering side effects.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
