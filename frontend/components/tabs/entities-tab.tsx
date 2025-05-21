"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CodeViewer } from "@/components/code-viewer"
import { Database, Shield, FileJson, Table2, Check, X, AlertTriangle } from "lucide-react"

interface EntitiesTabProps {
  appConfig: any
  setAppConfig: React.Dispatch<React.SetStateAction<any>>
}

export default function EntitiesTab({ appConfig, setAppConfig }: EntitiesTabProps) {
  const [selectedResource, setSelectedResource] = useState<string | null>(null)

  useEffect(() => {
    // Get resources from app config
    const resources = appConfig.resources || {}
    
    // Set the first resource as selected if available
    const resourceNames = Object.keys(resources)
    if (resourceNames.length > 0 && !selectedResource) {
      setSelectedResource(resourceNames[0])
    } else if (resourceNames.length === 0) {
      setSelectedResource(null)
    }
  }, [appConfig, selectedResource])

  const renderFieldType = (field: any) => {
    if (field.type === "reference") {
      return (
        <div>
          <Badge variant="outline">reference</Badge>
          <span className="ml-2 text-sm text-muted-foreground">
            → {field.reference.resource}.{field.reference.displayField}
          </span>
        </div>
      )
    }
    return <Badge variant="outline">{field.type}</Badge>
  }

  const renderPermissionMatrix = (resource: any) => {
    const permissions = resource.permissions
    const roles = Object.keys(permissions)
    const allActions = resource.actions

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            {allActions.map((action: string) => (
              <TableHead key={action}>{action}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role}>
              <TableCell className="font-medium">{role}</TableCell>
              {allActions.map((action: string) => (
                <TableCell key={`${role}-${action}`}>
                  {permissions[role].includes("*") || permissions[role].includes(action) ? (
                    <span className="text-green-500">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="text-red-500">
                      <X className="h-4 w-4" />
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const renderMockData = (resource: any) => {
    if (!resource.data || resource.data.length === 0) {
      return <p className="text-muted-foreground">No mock data available</p>
    }

    const columns = Object.keys(resource.data[0])

    return (
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {resource.data.map((item: any, index: number) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={`${index}-${column}`}>{item[column]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Get resources directly from app config
  const resources = appConfig.resources || {}
  const resourceNames = Object.keys(resources)
  
  if (resourceNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Entities Defined</h2>
        <p className="text-muted-foreground max-w-md">
          Your application doesn't have any entities defined yet. Entities represent the core data structures of your application.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex">
        <div className="w-1/4 pr-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Database className="mr-2 h-4 w-4" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {resourceNames.map((name) => (
                  <div
                    key={name}
                    className={`p-2 rounded-md cursor-pointer ${
                      selectedResource === name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedResource(name)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-3/4">
          {selectedResource && (
            <Tabs defaultValue="schema">
              <TabsList className="bg-muted dark:bg-secondary">
                <TabsTrigger
                  value="schema"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Schema
                </TabsTrigger>
                <TabsTrigger
                  value="permissions"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Permissions
                </TabsTrigger>
                <TabsTrigger
                  value="mockData"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  <Table2 className="mr-2 h-4 w-4" />
                  Mock Data
                </TabsTrigger>
                <TabsTrigger
                  value="json"
                  className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schema" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{selectedResource} Schema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Field</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(resources[selectedResource].fields).map(([fieldName, field]: [string, any]) => (
                          <TableRow key={fieldName}>
                            <TableCell className="font-medium">{fieldName}</TableCell>
                            <TableCell>{renderFieldType(field)}</TableCell>
                            <TableCell>
                              {field.required ? (
                                <span className="text-green-500">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  <X className="h-4 w-4" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {field.type === "reference" && (
                                <span className="text-sm text-muted-foreground">
                                  References {field.reference.resource}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissions" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{selectedResource} Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>{renderPermissionMatrix(resources[selectedResource])}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="mockData" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{selectedResource} Mock Data</CardTitle>
                  </CardHeader>
                  <CardContent>{renderMockData(resources[selectedResource])}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>{selectedResource} JSON</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
                      <CodeViewer
                        code={JSON.stringify(resources[selectedResource], null, 2)}
                        language="json"
                        className="code-editor-fullscreen"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
