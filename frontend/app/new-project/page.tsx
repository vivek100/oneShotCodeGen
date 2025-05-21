"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ChatPanel from "@/components/chat/chat-panel"
import { createProject, postMessage, startProjectWithMessage } from "@/api/api"
import { trackEvent, trackError } from "@/lib/mixpanelClient"

export default function NewProjectPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<any[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome! I'm your AI assistant. Tell me what kind of application you'd like to build, and I'll help you create it.",
    },
  ])
  const [isGenerating, setIsGenerating] = useState(false)

  // Custom message handler for new project
  const handleSendMessage = async (message: string) => {
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsGenerating(true)

    try {
      // Track new project creation started
      trackEvent("New Project Creation Started", {
        messageLength: message.length,
      });
      
      // Create a new project with a temporary title and send the first message
      const response = await startProjectWithMessage(
        message, 
        "New Project", 
        "Project description will be generated based on first message"
      )
      
      // Get the project ID from the response
      const projectId = response.project.id
      
      // Track successful project creation
      trackEvent("Project Created", {
        projectId,
        initialMessage: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      });
      
      // Navigate to the project page
      router.push(`/projects/${projectId}`)
    } catch (error) {
      console.error("Error creating project:", error)
      
      // Track error
      trackError("Project Creation Failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "error",
          content: "Failed to create project. Please try again.",
        },
      ])
      setIsGenerating(false)
    }
  }

  return (
    <div className="container py-6 max-w-4xl mx-auto h-[calc(100vh-2rem)]">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>Describe the application you want to build, and I'll help you create it.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ChatPanel
            projectId="new"
            messages={messages}
            setMessages={setMessages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
