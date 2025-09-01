"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, X, Mail, FileIcon, Cloud, Zap, AlertTriangle, Eye, Clipboard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CompressionUtils } from "@/lib/compression"
import { GlobalPasteHandler } from "./global-paste-handler"
import { MultipleRecipientsInput } from "./multiple-recipients-input"

export function FileUploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [recipients, setRecipients] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ file: File; url: string } | null>(null)
  const { toast } = useToast()

  const handleFilesFromPaste = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      const validFiles = newFiles.filter((file) => {
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
      setFiles((prev) => [...prev, ...validFiles])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const validFiles = newFiles.filter((file) => {
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
      setFiles((prev) => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePreviewImage = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewImage({ file, url })
    } else {
      toast({
        title: "Preview not available",
        description: "Preview is only available for image files.",
        variant: "destructive",
      })
    }
  }

  const closePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage.url)
      setPreviewImage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent, compress = true) => {
    e.preventDefault()

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
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

    if (compress) {
      setIsCompressing(true)
    } else {
      setIsUploading(true)
    }

    try {
      const formData = new FormData()
      formData.append("recipients", JSON.stringify(recipients))
      formData.append("compressed", compress.toString())

      if (compress) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const compressedBlob = await CompressionUtils.compressFile(file)

          let fileName = file.name
          let mimeType = compressedBlob.type

          if (file.type.startsWith("image/")) {
            fileName = file.name.replace(/\.[^/.]+$/, ".jpg")
            mimeType = "image/jpeg"
          } else if (file.type === "application/pdf") {
            mimeType = "application/pdf"
          } else {
            fileName = `${file.name}.gz`
            mimeType = "application/gzip"
          }

          const compressedFile = new File([compressedBlob], fileName, {
            type: mimeType,
          })

          formData.append(`file-${i}`, compressedFile)
          formData.append(`original-name-${i}`, file.name)
          formData.append(`original-size-${i}`, file.size.toString())
          formData.append(`compressed-size-${i}`, compressedBlob.size.toString())
          formData.append(`file-type-${i}`, file.type)
        }
      } else {
        files.forEach((file, index) => {
          formData.append(`file-${index}`, file)
        })
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        let compressionInfo = ""
        if (compress) {
          const totalOriginalSize = files.reduce((sum, file) => sum + file.size, 0)
          const imageFiles = files.filter((f) => f.type.startsWith("image/")).length
          const pdfFiles = files.filter((f) => f.type === "application/pdf").length

          if (imageFiles > 0 || pdfFiles > 0) {
            compressionInfo = ` (${imageFiles} image${imageFiles !== 1 ? "s" : ""} optimized${pdfFiles > 0 ? `, ${pdfFiles} PDF${pdfFiles !== 1 ? "s" : ""} compressed` : ""})`
          } else {
            compressionInfo = " (compressed)"
          }
        }

        const recipientText = recipients.length === 1 ? recipients[0] : `${recipients.length} recipients`
        toast({
          title: "Files sent successfully!",
          description: `${files.length} file(s) have been sent to ${recipientText}${compressionInfo}`,
        })
        setFiles([])
        setRecipients([])
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsCompressing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    return CompressionUtils.formatFileSize(bytes)
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const hasOversizedFiles = files.some((file) => !CompressionUtils.isWithinSizeLimit(file))

  return (
    <>
      <GlobalPasteHandler onFilesAdded={handleFilesFromPaste} isActive={true} mode="files" />

      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Cloud className="h-6 w-6 text-primary" />
            Upload Your Files
          </CardTitle>
          <CardDescription className="text-base">
            Select files, drag & drop, or press Ctrl+V to paste files. Add recipients to send files as attachments (20MB
            max per file)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-8">
            <MultipleRecipientsInput recipients={recipients} onRecipientsChange={setRecipients} required />

            <div className="space-y-3">
              <Label htmlFor="files" className="text-sm font-medium">
                Select Files
              </Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-card/80"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Input id="files" type="file" multiple onChange={handleFileChange} className="hidden" />
                <Label htmlFor="files" className="cursor-pointer flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg font-medium text-foreground block">
                      Drop files here or click to browse
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Support for multiple files (20MB max each) • Press Ctrl+V to paste files
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <Clipboard className="h-3 w-3" />
                    <span>Ctrl+V to paste files</span>
                  </div>
                </Label>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Selected Files ({files.length})</Label>
                  <span className="text-sm text-muted-foreground">Total: {formatFileSize(totalSize)}</span>
                </div>
                {hasOversizedFiles && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Some files exceed the 20MB limit</span>
                  </div>
                )}
                <div className="space-y-2 max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 bg-background rounded-lg border transition-colors ${
                        !CompressionUtils.isWithinSizeLimit(file)
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            {!CompressionUtils.isWithinSizeLimit(file) && (
                              <span className="text-xs text-destructive font-medium">Exceeds 20MB</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.type.startsWith("image/") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewImage(file)}
                            className="flex-shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={
                  isUploading || isCompressing || files.length === 0 || recipients.length === 0 || hasOversizedFiles
                }
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

              <Button
                type="button"
                variant="ghost"
                disabled={
                  isUploading || isCompressing || files.length === 0 || recipients.length === 0 || hasOversizedFiles
                }
                onClick={(e) => handleSubmit(e, false)}
                className="w-full h-10 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Sending Files...
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

      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={(open) => !open && closePreview()}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-lg font-semibold truncate">{previewImage.file.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(previewImage.file.size)} • {previewImage.file.type}
              </p>
            </DialogHeader>
            <div className="px-6 pb-6">
              <div className="relative bg-muted/30 rounded-lg overflow-hidden">
                <img
                  src={previewImage.url || "/placeholder.svg"}
                  alt={previewImage.file.name}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  onLoad={() => {
                    // Image loaded successfully
                  }}
                  onError={() => {
                    toast({
                      title: "Preview error",
                      description: "Unable to preview this image file.",
                      variant: "destructive",
                    })
                    closePreview()
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
