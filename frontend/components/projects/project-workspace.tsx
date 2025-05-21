"use client"

import { useState, useCallback, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChatPanel from "@/components/chat/chat-panel"
import PreviewTab from "@/components/tabs/preview-tab"
import VersionsTab from "@/components/tabs/versions-tab"
import UseCasesTab from "@/components/tabs/use-cases-tab"
import EntitiesTab from "@/components/tabs/entities-tab"
import RulesTab from "@/components/tabs/rules-tab"
import ReplayTab from "@/components/tabs/replay-tab"
import DeploymentTab from "@/components/tabs/deployment-tab"
import { FileText, Clock, LayoutGrid, Database, Shield, Play, Rocket } from "lucide-react"
import { getAppConfig } from "@/api/api"
import { wsClient } from "@/lib/websocket-client"

interface ProjectWorkspaceProps {
  projectId: string
  initialAppConfig: Record<string, unknown>
  initialMessages: unknown[]
}

export default function ProjectWorkspace({ projectId, initialAppConfig, initialMessages }: ProjectWorkspaceProps) {
  const [appConfig, setAppConfig] = useState<Record<string, unknown>>(initialAppConfig)
  const [messages, setMessages] = useState<unknown[]>(initialMessages)
  const [isReloading, setIsReloading] = useState(false)

  const memoizedSetMessages = useCallback((newMessages: unknown[] | ((prevMessages: unknown[]) => unknown[])) => {
    setMessages(newMessages)
  }, [])

  const memoizedSetAppConfig = useCallback((newConfig: Record<string, unknown> | ((prevConfig: Record<string, unknown>) => Record<string, unknown>)) => {
    setAppConfig(newConfig)
  }, [])

  // Function to reload the tabs content by fetching the latest app config
  const reloadTabs = useCallback(async () => {
    if (!projectId || projectId === "new") return

    setIsReloading(true)
    try {
      const latestConfig = await getAppConfig(projectId)
      setAppConfig(latestConfig)
    } catch (error) {
      console.error("Failed to reload app config:", error)
    } finally {
      setIsReloading(false)
    }
  }, [projectId])

  // Handle flow status changes
  const handleFlowStatus = useCallback((isRunning: boolean) => {
    console.log("Flow running status in workspace:", isRunning)
    
    // When flow completes (isRunning turns false), reload the tabs
    if (!isRunning) {
      reloadTabs()
      
      // Dispatch a custom event to notify other components (like sidebar)
      const event = new CustomEvent("flow-status-changed", { 
        detail: { projectId, isRunning } 
      })
      window.dispatchEvent(event)
    }
  }, [projectId, reloadTabs])

  // Set up WebSocket listener for flow status changes
  useEffect(() => {
    if (projectId === "new") return
    
    // Subscribe to flow status changes
    const unsubscribe = wsClient.onFlowStatusChange(handleFlowStatus)
    
    return () => {
      unsubscribe()
    }
  }, [projectId, handleFlowStatus])

  return (
    <div className="flex h-full">
      {/* Left Panel: Chat */}
      <div className="w-1/4 border-r h-full">
        <ChatPanel 
          projectId={projectId} 
          messages={messages} 
          setMessages={memoizedSetMessages} 
        />
      </div>

      {/* Right Panel: Tabbed Interface */}
      <div className="w-3/4 h-full overflow-auto">
        <Tabs defaultValue="preview" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4 justify-start">
            <TabsTrigger value="preview" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Versions
            </TabsTrigger>
            <TabsTrigger value="use-cases" className="flex items-center">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Use Cases
            </TabsTrigger>
            <TabsTrigger value="entities" className="flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Rules & Hooks
            </TabsTrigger>
            <TabsTrigger value="replay" className="flex items-center">
              <Play className="mr-2 h-4 w-4" />
              Replay Tool
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center">
              <Rocket className="mr-2 h-4 w-4" />
              Deployment
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-4">
            {isReloading && (
              <div className="text-center p-4 text-sm text-slate-500">
                Refreshing content...
              </div>
            )}
            <TabsContent value="preview" className="h-full">
              <PreviewTab appConfig={appConfig} projectId={projectId} />
            </TabsContent>

            <TabsContent value="versions" className="h-full">
              <VersionsTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="use-cases" className="h-full">
              <UseCasesTab appConfig={appConfig} setAppConfig={memoizedSetAppConfig} />
            </TabsContent>

            <TabsContent value="entities" className="h-full">
              <EntitiesTab appConfig={appConfig} setAppConfig={memoizedSetAppConfig} />
            </TabsContent>

            <TabsContent value="rules" className="h-full">
              <RulesTab appConfig={appConfig} />
            </TabsContent>

            <TabsContent value="replay" className="h-full">
              <ReplayTab projectId={projectId} />
            </TabsContent>

            <TabsContent value="deployment" className="h-full">
              <DeploymentTab appConfig={appConfig} projectId={projectId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
