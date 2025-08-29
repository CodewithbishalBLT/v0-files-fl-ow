import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { email, content, language, filename } = await request.json()

    if (!email || !content || !filename) {
      return NextResponse.json({ error: "Email, content, and filename are required" }, { status: 400 })
    }

    // Create transporter for Zoho SMTP
    const transporter = nodemailer.createTransporter({
      host: "smtp.zoho.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    })

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
      to: email,
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
          ${
            contentType === "code"
              ? `
          <div style="background-color: #1f2937; color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #10b981;">Preview:</h4>
            <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; overflow-x: auto;">${content.substring(0, 500)}${content.length > 500 ? "..." : ""}</pre>
          </div>
          `
              : ""
          }
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Privacy Note:</strong> Your content was not stored on our servers and was sent directly to your email for maximum security and privacy.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            This email was sent by FileFlow - Secure File Sharing
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
      message: `${contentType === "text" ? "Text" : "Code"} sent successfully to ${email}`,
    })
  } catch (error) {
    console.error("Send text error:", error)
    return NextResponse.json({ error: "Failed to send content" }, { status: 500 })
  }
}
