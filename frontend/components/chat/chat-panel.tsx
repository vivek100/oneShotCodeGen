"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { postMessage } from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import ChatMessage from "./chat-message"
import { wsClient, useWebSocketConnection } from "@/lib/websocket-client"
import { trackChatMessage, trackError } from "@/lib/mixpanelClient"

interface ChatPanelProps {
  projectId: string
  messages: any[]
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  onSendMessage?: (message: string) => Promise<void>
  isGenerating?: boolean
}

export default function ChatPanel({ projectId, messages, setMessages, onSendMessage, isGenerating }: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [flowRunning, setFlowRunning] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Connect to WebSocket if we have a valid project ID (not "new")
  const wsConnection = useWebSocketConnection(projectId !== "new" ? projectId : null);

  // Memoize message handler to prevent recreating on every render
  const handleMessage = useCallback((message: any) => {
    console.log("WebSocket message:", message);
    setMessages(prev => {
      // Check if this message already exists in the array
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, [setMessages]);

  // Memoize status handlers
  const handleFlowStatus = useCallback((isRunning: boolean) => {
    console.log("Flow running status:", isRunning);
    setFlowRunning(isRunning);
    
    // Dispatch a custom event when flow status changes
    // This will allow other components to react to the status change
    const event = new CustomEvent("flow-status-changed", { 
      detail: { projectId, isRunning } 
    });
    window.dispatchEvent(event);
  }, [projectId]);

  const handleConnection = useCallback((connected: boolean) => {
    console.log("WebSocket connected:", connected);
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    if (projectId === "new") {
      return;
    }

    // Set up WebSocket listeners using memoized handlers
    const messageUnsub = wsConnection.onMessage(handleMessage);
    const statusUnsub = wsConnection.onFlowStatusChange(handleFlowStatus);
    const connectionUnsub = wsConnection.onConnectionChange(handleConnection);

    // Cleanup listeners on unmount
    return () => {
      messageUnsub();
      statusUnsub();
      connectionUnsub();
    };
  }, [projectId, wsConnection, handleMessage, handleFlowStatus, handleConnection]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    // Track chat message sent using Mixpanel
    trackChatMessage(input, projectId);

    if (onSendMessage) {
      setInput("")
      await onSendMessage(input)
      return
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const replies = await postMessage(projectId, input)
      if (replies && Array.isArray(replies)) {
        setMessages(prev => [...prev, ...replies]);
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Track error with Mixpanel
      trackError("Failed to send chat message", { 
        projectId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "error",
          content: "Failed to send message. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Input is disabled if:
  // 1. A message is being generated on the new project page
  // 2. We're currently sending a message
  // 3. There's no input text
  // 4. A flow is running (from WebSocket status)
  const isButtonDisabled = isGenerating || isLoading || !input.trim() || flowRunning;
  
  // Show a slightly different status message when flow is running
  const inputPlaceholder = flowRunning 
    ? "AI is generating content... please wait" 
    : "Type your message...";

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg">Chat</h2>
        {projectId !== "new" && (
          <div className="text-sm">
            {isConnected ? (
              <span className="text-green-500 flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                Connected
              </span>
            ) : (
              <span className="text-amber-500 flex items-center">
                <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                Disconnected
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            disabled={isLoading || flowRunning}
            className="flex-1"
          />
          <Button type="submit" disabled={isButtonDisabled}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {flowRunning && (
          <div className="text-sm text-amber-500 mt-2">
            AI is generating content. Chat input is disabled until the process completes.
          </div>
        )}
      </div>
    </div>
  )
}
