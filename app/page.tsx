import { TabsInterface } from "@/components/tabs-interface"
import { Upload, Shield, Zap } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card/30 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">FilesFlow</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Share Files <span className="text-primary">Effortlessly</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
              We do not store your files – they are simply forwarded
              directly to your email.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            <TabsInterface />
          </div>

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
              Multiple Files
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
