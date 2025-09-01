import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { recipients, content, language, filename } = await request.json()

    if (!recipients || !content || !filename) {
      return NextResponse.json({ error: "Email, content, and filename are required" }, { status: 400 })
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid email addresses: ${invalidEmails.join(", ")}`,
        },
        { status: 400 },
      )
    }

    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const senderIP = (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || "Unknown"
    const userAgent = request.headers.get("user-agent") || "Unknown"
    const acceptLanguage = request.headers.get("accept-language") || "Unknown"
    const referer = request.headers.get("referer") || "Direct access"
    const timestamp = new Date().toISOString()
    // Create transporter for Zoho SMTP
        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.ZOHO_EMAIL,
            pass: process.env.ZOHO_PASSWORD,
          },
        })
    
        // Create file buffer from content
    // Create file buffer from content
    const fileBuffer = Buffer.from(content, "utf-8")

    const contentType = language === "text" ? "text" : "code"
    const languageLabel =
      language === "text"
        ? "Plain Text"
        : language === "c"
          ? "C"
          : language === "cpp"
            ? "C++"
            : language === "python"
              ? "Python"
              : language === "java"
                ? "Java"
                : language

    // Send email with text/code as attachment
    await transporter.sendMail({
      from: process.env.ZOHO_EMAIL,
      to: recipients.join(", "),
      subject: `Your ${contentType === "text" ? "Text" : "Code"} from FileFlow - ${filename}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your ${contentType === "text" ? "Text" : "Code"} from FileFlow</h2>
          <p>Hello!</p>
          <p>You've successfully shared your ${contentType} content through FileFlow. Your ${contentType} is attached as a formatted file.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">File Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin: 5px 0;"><strong>Filename:</strong> ${filename}</li>
              <li style="margin: 5px 0;"><strong>Type:</strong> ${languageLabel}</li>
              <li style="margin: 5px 0;"><strong>Size:</strong> ${content.length} characters</li>
            </ul>
          </div>
          ${contentType === "code"
          ? `
          <div style="background-color: #1f2937; color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #10b981;">Preview:</h4>
            <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; overflow-x: auto;">${content.substring(0, 500)}${content.length > 500 ? "..." : ""}</pre>
          </div>
          `
          : ""
        }
            
  <!-- Sender Information -->
  <div style="background-color: #f3f4f6; padding: 18px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #10b981;">
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937; border-bottom: 1px solid #d1d5db; padding-bottom: 8px;">
      📊 Sender Information
    </h3>
    <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
      <p style="margin: 4px 0;"><strong>IP Address:</strong> ${senderIP}</p>
      <p style="margin: 4px 0;"><strong>Browser:</strong> ${userAgent}</p>
      <p style="margin: 4px 0;"><strong>Language:</strong> ${acceptLanguage}</p>
      <p style="margin: 4px 0;"><strong>Referrer:</strong> ${referer}</p>
      <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
  </div>
 <!-- Footer -->
  <p style="font-size: 14px; color: #6b7280; margin-top: 32px; line-height: 1.5;">
    Best regards, <br>
    <strong style="color: #111827;"><a href="https://filesflow.web.app" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">
      FilesFlow
    </a></strong>  
    <span style="color: #9ca3af;">— Made with ❤️ by</span> 
    <a href="https://www.linkedin.com/in/bishal-das-bd/" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500;">
      Bishal Das
    </a>
  </p>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: fileBuffer,
          contentType: "text/plain",
        },
      ],
    })

    return NextResponse.json({
      success: true,
      message: `${contentType === "text" ? "Text" : "Code"} sent successfully to ${recipients.length} recipient(s)`,
    })
  } catch (error) {
    console.error("Send text error:", error)
    return NextResponse.json({ error: "Failed to send content" }, { status: 500 })
  }
}
