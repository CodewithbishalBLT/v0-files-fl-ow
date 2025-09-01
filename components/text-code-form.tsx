"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Code, Zap, AlertTriangle, Clipboard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CompressionUtils } from "@/lib/compression"
import { GlobalPasteHandler } from "./global-paste-handler"
import { MultipleRecipientsInput } from "./multiple-recipients-input"
import { CodeEditor } from "./code-editor"

const LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain Text", extension: "txt" },
  { value: "javascript", label: "JavaScript", extension: "js" },
  { value: "typescript", label: "TypeScript", extension: "ts" },
  { value: "python", label: "Python", extension: "py" },
  { value: "java", label: "Java", extension: "java" },
  { value: "c", label: "C", extension: "c" },
  { value: "cpp", label: "C++", extension: "cpp" },
  { value: "csharp", label: "C#", extension: "cs" },
  { value: "html", label: "HTML", extension: "html" },
  { value: "css", label: "CSS", extension: "css" },
  { value: "json", label: "JSON", extension: "json" },
  { value: "xml", label: "XML", extension: "xml" },
  { value: "sql", label: "SQL", extension: "sql" },
  { value: "markdown", label: "Markdown", extension: "md" },
  { value: "yaml", label: "YAML", extension: "yml" },
  { value: "shell", label: "Shell Script", extension: "sh" },
]

export function TextCodeForm() {
  const [recipients, setRecipients] = useState<string[]>([])
  const [content, setContent] = useState("")
  const [language, setLanguage] = useState("plaintext")
  const [filename, setFilename] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const { toast } = useToast()

  const handleTextFromPaste = (text: string) => {
    setContent((prev) => prev + text)
  }

  const handleSubmit = async (e: React.FormEvent, compress = true) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some text or code to share.",
        variant: "destructive",
      })
      return
    }

    if (recipients.length === 0) {
      toast({
        title: "Recipients required",
        description: "Please add at least one email recipient.",
        variant: "destructive",
      })
      return
    }

    const contentSize = new Blob([content]).size
    if (!CompressionUtils.isWithinSizeLimit(new File([content], "temp.txt"))) {
      toast({
        title: "Content too large",
        description: "Your content exceeds the 20MB limit. Please reduce the content size.",
        variant: "destructive",
      })
      return
    }

    if (compress) {
      setIsCompressing(true)
    } else {
      setIsSubmitting(true)
    }

    try {
      const selectedLanguage = LANGUAGE_OPTIONS.find((lang) => lang.value === language)
      const extension = selectedLanguage?.extension || "txt"
      const defaultFilename = language === "plaintext" ? "shared-text" : "shared-code"
      const finalFilename = filename.trim() || defaultFilename

      let requestBody: any = {
        recipients,
        content,
        language,
        filename: `${finalFilename}.${extension}`,
        compressed: compress,
      }

      if (compress) {
        // Compress the content
        const compressedBlob = await CompressionUtils.compressText(content)
        const compressedArray = new Uint8Array(await compressedBlob.arrayBuffer())
        const compressedBase64 = btoa(String.fromCharCode(...compressedArray))

        requestBody = {
          ...requestBody,
          compressedContent: compressedBase64,
          originalSize: contentSize,
          compressedSize: compressedBlob.size,
        }
      }

      const response = await fetch("/api/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (response.ok) {
        const compressionInfo = compress && result.compressionRatio ? ` (${result.compressionRatio}% smaller)` : ""
        const recipientText = recipients.length === 1 ? recipients[0] : `${recipients.length} recipients`
        toast({
          title: "Content sent successfully!",
          description: `Your ${language === "plaintext" ? "text" : "code"} has been sent to ${recipientText}${compressionInfo}`,
        })
        setContent("")
        setRecipients([])
        setFilename("")
        setLanguage("plaintext")
      } else {
        throw new Error(result.error || "Failed to send content")
      }
    } catch (error) {
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsCompressing(false)
    }
  }

  const selectedLanguage = LANGUAGE_OPTIONS.find((lang) => lang.value === language)

  const contentSize = new Blob([content]).size
  const isOversized = contentSize > 20 * 1024 * 1024 // 20MB
  const formattedSize = CompressionUtils.formatFileSize(contentSize)

  return (
    <>
      <GlobalPasteHandler onTextAdded={handleTextFromPaste} isActive={true} mode="text" />

      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Code className="h-6 w-6 text-primary" />
            Share Text & Code
          </CardTitle>
          <CardDescription className="text-base">
            Write or paste your code with syntax highlighting and preview. Add recipients to receive it as a formatted
            file via email (20MB max)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
            <MultipleRecipientsInput recipients={recipients} onRecipientsChange={setRecipients} required />

            {/* Filename Input */}
            <div className="space-y-3">
              <Label htmlFor="filename" className="text-sm font-medium">
                Filename (optional)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="filename"
                  type="text"
                  placeholder={language === "plaintext" ? "shared-text" : "shared-code"}
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="h-12 text-base bg-input border-border focus:border-primary transition-colors"
                />
                <span className="text-sm text-muted-foreground font-mono">.{selectedLanguage?.extension}</span>
              </div>
            </div>

            {/* Size and Warning Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Size: {formattedSize}</span>
                {isOversized && <span className="text-xs text-destructive font-medium">Exceeds 20MB</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                <Clipboard className="h-3 w-3" />
                <span>Press Ctrl+V to paste content</span>
              </div>
            </div>

            {isOversized && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Content exceeds the 20MB limit</span>
              </div>
            )}

            <CodeEditor
              value={content}
              onChange={setContent}
              language={language}
              onLanguageChange={setLanguage}
              placeholder={
                language === "plaintext"
                  ? "Enter your text content here..."
                  : `Enter your ${selectedLanguage?.label} code here...`
              }
            />

            <div className="space-y-3">
              {/* Primary Button - Send with Compression */}
              <Button
                type="submit"
                disabled={isSubmitting || isCompressing || !content.trim() || recipients.length === 0 || isOversized}
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
              >
                {isCompressing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Compressing & Sending...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-3" />
                    Send after Compression
                  </>
                )}
              </Button>

              {/* Secondary Button - Send without Compression */}
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting || isCompressing || !content.trim() || recipients.length === 0 || isOversized}
                onClick={(e) => handleSubmit(e, false)}
                className="w-full h-10 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Sending Content...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send without Compression
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
