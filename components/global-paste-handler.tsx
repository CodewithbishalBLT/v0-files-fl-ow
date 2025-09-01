"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { CompressionUtils } from "@/lib/compression"

interface GlobalPasteHandlerProps {
  onFilesAdded?: (files: File[]) => void
  onTextAdded?: (text: string) => void
  isActive: boolean
  mode: "files" | "text"
}

export function GlobalPasteHandler({ onFilesAdded, onTextAdded, isActive, mode }: GlobalPasteHandlerProps) {
  const { toast } = useToast()

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste when the current tab is active
      if (!isActive) return

      // Don't interfere with paste in input fields, textareas, or contenteditable elements
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }

      const clipboardData = e.clipboardData
      if (!clipboardData) return

      // Handle file mode
      if (mode === "files" && onFilesAdded) {
        const items = Array.from(clipboardData.items)
        const files: File[] = []

        items.forEach((item) => {
          if (item.kind === "file") {
            const file = item.getAsFile()
            if (file) {
              files.push(file)
            }
          }
        })

        if (files.length > 0) {
          e.preventDefault()

          // Filter files by size limit
          const validFiles = files.filter((file) => {
            if (!CompressionUtils.isWithinSizeLimit(file)) {
              toast({
                title: "File too large",
                description: `${file.name} exceeds the 20MB limit and was not added.`,
                variant: "destructive",
              })
              return false
            }
            return true
          })

          if (validFiles.length > 0) {
            onFilesAdded(validFiles)
            toast({
              title: "Files added from clipboard",
              description: `${validFiles.length} file(s) added via Ctrl+V`,
            })
          }
        }
      }

      // Handle text mode
      if (mode === "text" && onTextAdded) {
        const text = clipboardData.getData("text/plain")
        if (text && text.trim()) {
          e.preventDefault()
          onTextAdded(text)
          toast({
            title: "Text added from clipboard",
            description: "Content pasted via Ctrl+V",
          })
        }
      }
    }

    // Add global paste event listener
    document.addEventListener("paste", handlePaste)

    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [isActive, mode, onFilesAdded, onTextAdded, toast])

  return null
}
