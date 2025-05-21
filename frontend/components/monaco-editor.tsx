"use client"

import { useRef, useEffect, useState } from "react"
import * as monaco from "monaco-editor"
import { Loader2 } from "lucide-react"

// Import the required languages
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution"
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution"
import "monaco-editor/esm/vs/basic-languages/json/json.contribution"
import "monaco-editor/esm/vs/language/json/jsonMode"
import "monaco-editor/esm/vs/language/typescript/tsMode"

interface MonacoEditorProps {
  value: string
  language: string
  height?: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export default function MonacoEditor({
  value,
  language,
  height = "300px",
  onChange,
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize Monaco
  useEffect(() => {
    // This ensures Monaco is fully initialized
    monaco.editor.onDidCreateEditor(() => {
      setIsInitialized(true)
    })

    // Set default theme
    monaco.editor.defineTheme("customTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1e1e2e",
      },
    })

    monaco.editor.setTheme("customTheme")

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Create editor instance
  useEffect(() => {
    if (editorRef.current && !editor) {
      try {
        // Ensure we're using a supported language
        const supportedLanguage = ["json", "javascript", "typescript"].includes(language) ? language : "plaintext"

        const newEditor = monaco.editor.create(editorRef.current, {
          value,
          language: supportedLanguage,
          theme: "customTheme",
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          readOnly,
          fontSize: 14,
          lineNumbers: "on",
          renderLineHighlight: "all",
          roundedSelection: true,
          selectOnLineNumbers: true,
          wordWrap: "on",
        })

        setEditor(newEditor)
        setIsLoading(false)

        return () => {
          newEditor.dispose()
        }
      } catch (error) {
        console.error("Error initializing Monaco Editor:", error)
        setIsLoading(false)
      }
    }
  }, [editorRef, language, readOnly, editor])

  // Update value when it changes externally
  useEffect(() => {
    if (editor) {
      // Only update if the value is different to avoid cursor position reset
      if (editor.getValue() !== value) {
        editor.setValue(value)
      }
    }
  }, [editor, value])

  // Set up onChange handler
  useEffect(() => {
    if (editor && onChange) {
      const disposable = editor.onDidChangeModelContent(() => {
        onChange(editor.getValue())
      })

      return () => {
        disposable.dispose()
      }
    }
  }, [editor, onChange])

  return (
    <div className="relative border rounded-md overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div ref={editorRef} style={{ height }} className="monaco-editor-container" />
    </div>
  )
}
