"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Code } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleEditorProps {
  value: string
  language?: string
  height?: string
  onChange?: (value: string) => void
  readOnly?: boolean
  className?: string
}

export default function SimpleEditor({
  value,
  language,
  height = "300px",
  onChange,
  readOnly = false,
  className,
}: SimpleEditorProps) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Adjust textarea height based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, Number.parseInt(height))}px`
    }
  }, [value, height])

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <div className={cn("relative border rounded-md overflow-hidden bg-slate-900", className)}>
      <div className="flex items-center justify-between p-2 bg-slate-800 border-b">
        <div className="flex items-center">
          <Code className="h-4 w-4 mr-2 text-slate-400" />
          <span className="text-xs text-slate-300">{language || "text"}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        className={`w-full p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none ${
          !readOnly ? "border-l-2 border-primary focus:border-primary" : ""
        }`}
        style={{
          height,
          minHeight: height,
          whiteSpace: "pre",
          overflowWrap: "normal",
          overflowX: "auto",
          display: "block",
        }}
      />
    </div>
  )
}
