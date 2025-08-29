"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, FileText, Code } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const LANGUAGE_OPTIONS = [
  { value: "text", label: "Plain Text", extension: "txt" },
  { value: "c", label: "C", extension: "c" },
  { value: "cpp", label: "C++", extension: "cpp" },
  { value: "python", label: "Python", extension: "py" },
  { value: "java", label: "Java", extension: "java" },
]

export function TextCodeForm() {
  const [email, setEmail] = useState("")
  const [content, setContent] = useState("")
  const [language, setLanguage] = useState("text")
  const [filename, setFilename] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some text or code to share.",
        variant: "destructive",
      })
      return
    }

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const selectedLanguage = LANGUAGE_OPTIONS.find((lang) => lang.value === language)
      const extension = selectedLanguage?.extension || "txt"
      const defaultFilename = language === "text" ? "shared-text" : "shared-code"
      const finalFilename = filename.trim() || defaultFilename

      const response = await fetch("/api/send-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          content,
          language,
          filename: `${finalFilename}.${extension}`,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Content sent successfully!",
          description: `Your ${language === "text" ? "text" : "code"} has been sent to ${email}`,
        })
        setContent("")
        setEmail("")
        setFilename("")
        setLanguage("text")
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
    }
  }

  const selectedLanguage = LANGUAGE_OPTIONS.find((lang) => lang.value === language)

  return (
    <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Code className="h-6 w-6 text-primary" />
          Share Text & Code
        </CardTitle>
        <CardDescription className="text-base">
          Enter your text or code and receive it as a formatted file via email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-3">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-primary" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base bg-input border-border focus:border-primary transition-colors"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Content Type</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-12 text-base bg-input border-border focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      {lang.value === "text" ? <FileText className="h-4 w-4" /> : <Code className="h-4 w-4" />}
                      {lang.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filename Input */}
          <div className="space-y-3">
            <Label htmlFor="filename" className="text-sm font-medium">
              Filename (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                type="text"
                placeholder={language === "text" ? "shared-text" : "shared-code"}
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-12 text-base bg-input border-border focus:border-primary transition-colors"
              />
              <span className="text-sm text-muted-foreground font-mono">.{selectedLanguage?.extension}</span>
            </div>
          </div>

          {/* Content Input */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">
              {language === "text" ? "Text Content" : "Code Content"}
            </Label>
            <Textarea
              id="content"
              placeholder={
                language === "text"
                  ? "Enter your text content here..."
                  : `Enter your ${selectedLanguage?.label} code here...`
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="text-base bg-input border-border focus:border-primary transition-colors font-mono resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !content.trim() || !email}
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Sending Content...
              </>
            ) : (
              <>
                <Mail className="h-5 w-5 mr-3" />
                Send {language === "text" ? "Text" : "Code"} via Email
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
