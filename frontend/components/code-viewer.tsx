"use client"

import { useState } from "react"
import SimpleEditor from "@/components/simple-editor"
import { cn } from "@/lib/utils"

interface CodeViewerProps {
  code: string
  language: string
  editable?: boolean
  onChange?: (value: string) => void
  className?: string
}

export function CodeViewer({ code, language, editable = false, onChange, className }: CodeViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("relative", className)}>
      <SimpleEditor
        value={code}
        language={language}
        readOnly={!editable}
        onChange={onChange}
        height={editable ? "300px" : "400px"}
        className={className}
      />
    </div>
  )
}
