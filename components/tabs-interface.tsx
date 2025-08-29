"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploadForm } from "@/components/file-upload-form"
import { TextCodeForm } from "@/components/text-code-form"
import { Upload, Code } from "lucide-react"

export function TabsInterface() {
  return (
    <Tabs defaultValue="files" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="files" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Files
        </TabsTrigger>
        <TabsTrigger value="text" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Share Text/Code
        </TabsTrigger>
      </TabsList>

      <TabsContent value="files">
        <FileUploadForm />
      </TabsContent>

      <TabsContent value="text">
        <TextCodeForm />
      </TabsContent>
    </Tabs>
  )
}
