"use client"

import { FileUploadForm } from "@/components/file-upload-form"
import { TextCodeForm } from "@/components/text-code-form"
import { Upload, Code, Shield, Zap } from "lucide-react"

interface PageContentProps {
  currentPage: string
}

export function PageContent({ currentPage }: PageContentProps) {
  const pageConfig = {
    files: {
      title: "Upload Files",
      subtitle: "Share Files Effortlessly",
      description:
        "Upload and share your files securely. We do not store your files – they are simply forwarded directly to your email.",
      icon: Upload,
      component: <FileUploadForm />,
    },
    text: {
      title: "Share Text/Code",
      subtitle: "Share Text & Code Instantly",
      description: "Send text content, code snippets, or any textual data quickly and securely through email.",
      icon: Code,
      component: <TextCodeForm />,
    },
  }

  const config = pageConfig[currentPage as keyof typeof pageConfig]
  const Icon = config.icon

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-background via-card/30 to-background">
      <div className="container mx-auto px-4 py-12 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {config.subtitle.split(" ").map((word, index) =>
                word === "Effortlessly" || word === "Instantly" ? (
                  <span key={index} className="text-primary">
                    {word}
                  </span>
                ) : (
                  <span key={index}>{word} </span>
                ),
              )}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">{config.description}</p>
          </div>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto mb-8">{config.component}</div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Secure Transfer
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-primary" />
              Instant Delivery
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4 text-primary" />
              {currentPage === "files" ? "Multiple Files" : "Rich Text Support"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
