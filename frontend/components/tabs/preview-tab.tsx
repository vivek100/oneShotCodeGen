"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, AlertTriangle, RefreshCcw, Code } from "lucide-react"
import { generateCode } from "@/api/api"
import { CodeDownloadButton } from "@/components/CodeDownloadButton"

interface PreviewTabProps {
  appConfig: any
  projectId?: string
}

export default function PreviewTab({ appConfig, projectId = "" }: PreviewTabProps) {
  const [iframeKey, setIframeKey] = useState(0)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  const isEmptyConfig = !appConfig?.app?.name || !appConfig?.resources || Object.keys(appConfig?.resources || {}).length === 0

  const handleDownload = () => {
    if (isEmptyConfig) return
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appConfig, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${appConfig.app.name.replace(/\s+/g, "-").toLowerCase()}-config.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    document.body.removeChild(downloadAnchorNode)
  }

  const handleReload = () => {
    setIframeKey(prev => prev + 1)
  }

  const handleDownloadCode = async () => {
    if (isEmptyConfig || !projectId) return
    
    try {
      setIsGeneratingCode(true)
      const response = await generateCode(projectId)
      
      if (!response.ok) {
        throw new Error('Failed to generate code')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${appConfig.app.name.replace(/\s+/g, "-").toLowerCase()}-code.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  if (isEmptyConfig) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Application Not Generated Yet</h2>
              <p className="text-muted-foreground max-w-md">
                Your application configuration hasn't been generated yet. Use the entities, rules, and use cases tabs to define your requirements, then generate your application.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-2 border-b flex items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="mx-auto text-sm text-muted-foreground">Preview</div>
          </div>
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 h-[500px] bg-muted/20">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-medium">No Preview Available</h3>
            <p className="text-muted-foreground max-w-md">
              A preview will be available once your application has been generated.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-2 border-b flex items-center justify-between">
          {/* Left Side: Colored Buttons */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>

          {/* Center: Title */}
          <div className="text-sm text-muted-foreground font-medium">Live Preview</div>

          {/* Right Side: Buttons */}
          <div className="flex items-center space-x-2">
            <CodeDownloadButton 
              projectId={projectId} 
              appConfig={appConfig}
              icon={<Download className="h-4 w-4 mr-1" />}
              size="sm"
            />
            <Button variant="ghost" size="sm" onClick={handleReload}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* iframe */}
        <iframe
          key={iframeKey}  // <-- this forces iframe to reload on key change
          src={`${backendUrl}/api/preview?id=${projectId}`}
          className="w-full h-[calc(100vh-120px)] border-0"
          title="App Preview"
        />
      </div>
    </div>
  )
}
