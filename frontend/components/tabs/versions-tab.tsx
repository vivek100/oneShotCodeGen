"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeViewer } from "@/components/code-viewer"
import { FileText, GitBranch, GitCompare, Calendar, User, Clock, ArrowRight, AlertTriangle } from "lucide-react"
import { getVersions } from "@/api/api"

interface VersionsTabProps {
  projectId: string
}

export default function VersionsTab({ projectId }: VersionsTabProps) {
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState<any>(null)
  const [compareVersion, setCompareVersion] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"single" | "diff">("single")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadVersions = async () => {
      setIsLoading(true)
      try {
        const versionsData = await getVersions(projectId)
        setVersions(versionsData)
        if (versionsData.length > 0) {
          setSelectedVersion(versionsData[0])
        } else {
          setSelectedVersion(null)
        }
      } catch (error) {
        console.error("Error loading versions:", error)
        setVersions([])
        setSelectedVersion(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadVersions()
  }, [projectId])

  const handleVersionSelect = (version: any) => {
    setSelectedVersion(version)
    if (viewMode === "diff" && !compareVersion) {
      setCompareVersion(versions.find((v) => v.id !== version.id))
    }
  }

  const handleCompareSelect = (version: any) => {
    setCompareVersion(version)
  }

  const toggleViewMode = () => {
    if (viewMode === "single") {
      setViewMode("diff")
      if (!compareVersion && versions.length > 1) {
        setCompareVersion(versions.find((v) => v.id !== selectedVersion?.id))
      }
    } else {
      setViewMode("single")
    }
  }

  if (isLoading) return <div className="flex justify-center p-8">Loading versions...</div>

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Versions Available</h2>
        <p className="text-muted-foreground max-w-md">
          There are no versions of your application available yet. Generate your application to create your first version.
        </p>
      </div>
    )
  }

  if (!selectedVersion) return <div className="flex justify-center p-8">No versions available</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Version History</h2>
        <Button variant="outline" onClick={toggleViewMode} disabled={versions.length < 2}>
          {viewMode === "single" ? (
            <>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare Versions
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Single View
            </>
          )}
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="w-1/3">
          <div className="space-y-3">
            {versions.map((version) => (
              <Card
                key={version.id}
                className={`cursor-pointer hover:border-primary transition-colors ${
                  selectedVersion?.id === version.id ? "border-primary" : ""
                }`}
                onClick={() => handleVersionSelect(version)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                        v{version.version_number}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3 mr-1" />
                        {version.created_by || "System"}
                      </div>
                      {version.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{version.description}</p>
                      )}
                    </div>
                    {viewMode === "diff" && compareVersion?.id === version.id && (
                      <Badge variant="outline">Compare</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="w-2/3">
          {viewMode === "single" ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    Version {selectedVersion.version_number}
                    {selectedVersion.is_current && (
                      <Badge variant="outline" className="ml-2">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(selectedVersion.created_at).toLocaleString()}
                  </div>
                </div>
                {selectedVersion.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedVersion.description}</p>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="json">
                  <TabsList className="bg-muted dark:bg-secondary">
                    <TabsTrigger
                      value="json"
                      className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      JSON
                    </TabsTrigger>
                    <TabsTrigger
                      value="tree"
                      className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                    >
                      <GitBranch className="mr-2 h-4 w-4" />
                      Tree View
                    </TabsTrigger>
                    <TabsTrigger
                      value="changes"
                      className="flex items-center data-[state=active]:bg-background dark:data-[state=active]:bg-background"
                    >
                      <GitCompare className="mr-2 h-4 w-4" />
                      Changes
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="json" className="mt-4">
                    <div className="overflow-auto" style={{ maxHeight: "70vh" }}>
                      <CodeViewer
                        code={JSON.stringify(selectedVersion.config_json, null, 2)}
                        language="json"
                        className="code-editor-fullscreen"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="tree" className="mt-4">
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-muted-foreground">Tree view coming soon...</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="changes" className="mt-4">
                    <div className="space-y-4">
                      {selectedVersion.changes ? (
                        <div className="space-y-2">
                          {selectedVersion.changes.map((change: any, index: number) => (
                            <div key={index} className="flex items-start p-2 border rounded-md">
                              <Badge
                                variant={
                                  change.type === "add"
                                    ? "default"
                                    : change.type === "remove"
                                      ? "destructive"
                                      : "outline"
                                }
                                className="mr-2 mt-0.5"
                              >
                                {change.type}
                              </Badge>
                              <div>
                                <p className="text-sm font-medium">{change.path}</p>
                                <p className="text-xs text-muted-foreground">{change.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No change information available for this version.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge className="bg-primary/20 text-primary">v{selectedVersion.version_number}</Badge>
                    <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                    <Badge className="bg-primary/20 text-primary">v{compareVersion?.version_number}</Badge>
                  </div>
                  <Badge variant="outline">Diff View</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium">From</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(selectedVersion.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">To</div>
                    <div className="text-xs text-muted-foreground">
                      {compareVersion && new Date(compareVersion.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <p className="text-muted-foreground text-center">Diff view coming soon...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
