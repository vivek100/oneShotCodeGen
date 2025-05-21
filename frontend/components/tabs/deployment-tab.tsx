"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Code } from "lucide-react"
import { useState } from "react"
import { CodeDownloadButton } from "@/components/CodeDownloadButton"

interface DeploymentTabProps {
  appConfig: any
  projectId?: string
}

export default function DeploymentTab({ appConfig, projectId = "" }: DeploymentTabProps) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  const handleDownloadConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appConfig, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${appConfig.app.name.replace(/\s+/g, "-").toLowerCase()}-config.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <h3 className="font-medium">Download Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your app configuration as a JSON file to use with your deployment.
                  </p>
                  <Button onClick={handleDownloadConfig} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Config
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <h3 className="font-medium">Download Source Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Export your app as a standalone React application with all required files.
                  </p>
                  <CodeDownloadButton 
                    projectId={projectId} 
                    appConfig={appConfig}
                    icon={<Code className="mr-2 h-4 w-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <CardTitle>Deployment Options</CardTitle>
            <Badge variant="outline" className="ml-2">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ExternalLink className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Vercel</h3>
                <p className="text-sm text-muted-foreground mb-4">Deploy your app to Vercel with one click</p>
                <Button variant="outline" disabled>
                  Deploy to Vercel
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ExternalLink className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">Render</h3>
                <p className="text-sm text-muted-foreground mb-4">Deploy your app to Render with one click</p>
                <Button variant="outline" disabled>
                  Deploy to Render
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center">
            <CardTitle>Connect Services</CardTitle>
            <Badge variant="outline" className="ml-2">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/50">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <h3 className="font-medium mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect Auth0, Clerk, or NextAuth</p>
                <Button variant="outline" disabled>
                  Connect Auth
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <h3 className="font-medium mb-2">Database</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect Supabase, Neon, or MongoDB</p>
                <Button variant="outline" disabled>
                  Connect Database
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <h3 className="font-medium mb-2">Storage</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect S3, Cloudinary, or Vercel Blob</p>
                <Button variant="outline" disabled>
                  Connect Storage
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
