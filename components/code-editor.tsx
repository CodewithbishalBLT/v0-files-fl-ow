"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, FileText, Copy, Download, Maximize2, Minimize2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Extended language options with more programming languages
const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain Text", extension: "txt", monaco: "plaintext" },
  { value: "javascript", label: "JavaScript", extension: "js", monaco: "javascript" },
  { value: "typescript", label: "TypeScript", extension: "ts", monaco: "typescript" },
  { value: "python", label: "Python", extension: "py", monaco: "python" },
  { value: "java", label: "Java", extension: "java", monaco: "java" },
  { value: "c", label: "C", extension: "c", monaco: "c" },
  { value: "cpp", label: "C++", extension: "cpp", monaco: "cpp" },
  { value: "csharp", label: "C#", extension: "cs", monaco: "csharp" },
  { value: "html", label: "HTML", extension: "html", monaco: "html" },
  { value: "css", label: "CSS", extension: "css", monaco: "css" },
  { value: "json", label: "JSON", extension: "json", monaco: "json" },
  { value: "xml", label: "XML", extension: "xml", monaco: "xml" },
  { value: "sql", label: "SQL", extension: "sql", monaco: "sql" },
  { value: "markdown", label: "Markdown", extension: "md", monaco: "markdown" },
  { value: "yaml", label: "YAML", extension: "yml", monaco: "yaml" },
  { value: "shell", label: "Shell Script", extension: "sh", monaco: "shell" },
]

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  onLanguageChange: (language: string) => void
  placeholder?: string
}

export function CodeEditor({ value, onChange, language, onLanguageChange, placeholder }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [charCount, setCharCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const loadMonaco = async () => {
      if (typeof window !== "undefined" && !monacoRef.current && !isLoading) {
        setIsLoading(true)
        try {
          if ((window as any).monaco) {
            monacoRef.current = (window as any).monaco
            initializeEditor()
            return
          }

          const script = document.createElement("script")
          script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"

          script.onload = () => {
            try {
              const require = (window as any).require
              if (!require) {
                throw new Error("RequireJS not loaded")
              }

              require.config({
                paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" },
                ignoreDuplicateModules: true,
              })

              if (typeof window !== "undefined") {
                ;(window as any).MonacoEnvironment = {
                  getWorkerUrl: (moduleId: string, label: string) => {
                    if (label === "json") {
                      return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/json/json.worker.js"
                    }
                    if(label === "java"){
                        return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/java/java.worker.js"
                    }
                    if (label === "css" || label === "scss" || label === "less") {
                      return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/css/css.worker.js"
                    }
                    if (label === "html" || label === "handlebars" || label === "razor") {
                      return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/html/html.worker.js"
                    }
                    if (label === "typescript" || label === "javascript") {
                      return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js"
                    }
                    return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js"
                  },
                }
              }

              require(["vs/editor/editor.main"], (monaco: any) => {
                monacoRef.current = monaco
                ;(window as any).monaco = monaco
                initializeEditor()
              }, (error: any) => {
                console.error("Failed to load Monaco modules:", error)
                setIsLoading(false)
              })
            } catch (error) {
              console.error("Failed to configure Monaco:", error)
              setIsLoading(false)
            }
          }

          script.onerror = () => {
            console.error("Failed to load Monaco loader script")
            setIsLoading(false)
          }

          document.head.appendChild(script)
        } catch (error) {
          console.error("Failed to load Monaco Editor:", error)
          setIsLoading(false)
        }
      }
    }

    loadMonaco()

    return () => {
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.dispose()
        } catch (error) {
          console.error("Error disposing editor:", error)
        }
      }
    }
  }, [editorKey]) // Added editorKey dependency to re-initialize when key changes

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && editorRef.current && !editorInstanceRef.current) {
        // Re-initialize editor when tab becomes visible again
        setTimeout(() => {
          setEditorKey((prev) => prev + 1)
        }, 100)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [])

  const initializeEditor = () => {
    if (!monacoRef.current || !editorRef.current || editorInstanceRef.current) return

    try {
      const selectedLang = LANGUAGE_OPTIONS.find((lang) => lang.value === language)
      const monacoLanguage = selectedLang?.monaco || "plaintext"

      editorInstanceRef.current = monacoRef.current.editor.create(editorRef.current, {
        value: value || "",
        language: monacoLanguage,
        theme: "vs-dark",
        fontSize: 14,
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "on",
        tabSize: 2,
        insertSpaces: true,
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3,
        glyphMargin: false,
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          showVariables: true,
          showClasses: true,
          showModules: true,
          localityBonus: true,
          shareSuggestSelections: false,
        },
        quickSuggestions: {
          other: true,
          comments: true,
          strings: true,
        },
        renderValidationDecorations: "on",
        scrollbar: {
          vertical: "visible",
          horizontal: "visible",
          useShadows: false,
          verticalHasArrows: false,
          horizontalHasArrows: false,
        },
        parameterHints: { enabled: true },
        hover: { enabled: true },
        contextmenu: true,
        mouseWheelZoom: false,
        links: false,
        colorDecorators: true,
        codeLens: false,
        lightbulb: { enabled: false },
      })

      let changeTimeout: NodeJS.Timeout
      editorInstanceRef.current.onDidChangeModelContent(() => {
        clearTimeout(changeTimeout)
        changeTimeout = setTimeout(() => {
          const newValue = editorInstanceRef.current?.getValue() || ""
          onChange(newValue)
          updateStats(newValue)
        }, 100)
      })

      editorInstanceRef.current.onDidFocusEditorText(() => {
        if (placeholder && !value) {
          // Handle placeholder logic if needed
        }
      })

      setIsEditorReady(true)
      setIsLoading(false)
      updateStats(value || "")
    } catch (error) {
      console.error("Failed to initialize editor:", error)
      setIsLoading(false)
    }
  }

  const updateStats = (content: string) => {
    const lines = content ? content.split("\n").length : 1
    setLineCount(lines)
    setCharCount(content.length)
  }

  useEffect(() => {
    if (editorInstanceRef.current && monacoRef.current && isEditorReady) {
      try {
        const selectedLang = LANGUAGE_OPTIONS.find((lang) => lang.value === language)
        const monacoLanguage = selectedLang?.monaco || "plaintext"
        const model = editorInstanceRef.current.getModel()

        if (model && monacoRef.current.editor.getModels().includes(model)) {
          monacoRef.current.editor.setModelLanguage(model, monacoLanguage)
        }
      } catch (error) {
        console.error("Failed to change language:", error)
      }
    }
  }, [language, isEditorReady])

  useEffect(() => {
    if (editorInstanceRef.current && isEditorReady) {
      const currentValue = editorInstanceRef.current.getValue()
      if (currentValue !== value) {
        try {
          editorInstanceRef.current.setValue(value || "")
          updateStats(value || "")
        } catch (error) {
          console.error("Failed to update editor value:", error)
        }
      }
    }
  }, [value, isEditorReady])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: "Code copied!",
        description: "The code has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    const selectedLang = LANGUAGE_OPTIONS.find((lang) => lang.value === language)
    const extension = selectedLang?.extension || "txt"
    const blob = new Blob([value], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const selectedLang = LANGUAGE_OPTIONS.find((lang) => lang.value === language)

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      <Card
        className={`${isFullscreen ? "h-full border-0 rounded-none" : "shadow-lg border-0 bg-card/50 backdrop-blur-sm"}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Code Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {lineCount} lines • {charCount} chars
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleCopyCode} disabled={!value}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!value}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center gap-2">
                        {lang.value === "plaintext" ? <FileText className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                        {lang.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className={`${isFullscreen ? "h-[calc(100vh-120px)]" : "h-96"}`}>
          <div className="h-full relative">
            <div
              ref={editorRef}
              key={editorKey}
              className="h-full border rounded-lg overflow-hidden"
              style={{ minHeight: "300px" }}
            />
            {(!isEditorReady || isLoading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg backdrop-blur-sm">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isLoading ? "Loading editor..." : "Initializing..."}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
