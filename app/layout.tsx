import type { Metadata } from "next"
import { DM_Sans } from 'next/font/google'
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "FileFlow - Modern File Sharing",
  description: "Upload files and receive them instantly via email. Simple, secure, and professional file sharing.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} antialiased`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
