import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const recipientsData = formData.get("recipients") as string

    if (!recipientsData) {
      return NextResponse.json({ error: "Recipients are required" }, { status: 400 })
    }

    let recipients: string[]
    try {
      recipients = JSON.parse(recipientsData)
    } catch {
      return NextResponse.json({ error: "Invalid recipients format" }, { status: 400 })
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


    // Derive client IP from headers (NextRequest in route handlers has no 'ip' property)
    const forwardedFor = request.headers.get("x-forwarded-for")
    const senderIP = (forwardedFor?.split(",")[0] || request.headers.get("x-real-ip") || "Unknown").trim()
    const userAgent = request.headers.get("user-agent") || "Unknown"
    const acceptLanguage = request.headers.get("accept-language") || "Unknown"
    const referer = request.headers.get("referer") || "Direct access"
    const timestamp = new Date().toISOString()

    // Extract files from formData
    const files: { filename: string; content: Buffer }[] = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file-") && value && typeof value === "object" && "arrayBuffer" in value && typeof (value as any).arrayBuffer === "function") {
        const buffer = Buffer.from(await value.arrayBuffer())
        files.push({
          filename: value.name,
          content: buffer,
        })
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Configure Zoho SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.in",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD,
      },
    })

    // Prepare email attachments
    const attachments = files.map((file) => ({
      filename: file.filename,
      content: file.content,
    }))

    // Send email with attachments
    const mailOptions = {
      from: `"FilesFlow" <${process.env.ZOHO_EMAIL}>`,
      to: recipients.join(", "),
      subject: `FilesFlow - Your uploaded files - ${files.length} file(s)`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  
  <!-- Header -->
  <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px 0; text-align: center;">
    Your Files Have Been Processed
  </h2>
  
  <!-- Greeting -->
  <p style="font-size: 15px; color: #374151; margin: 12px 0;">
    Hello,
  </p>
  
  <!-- Main message -->
  <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 12px 0;">
    We’ve successfully received and processed your uploaded files.  
    Please find them attached to this email.
  </p>
  
  <!-- File list container -->
  <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px; margin: 24px 0;">
    <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
      📂 Files Included
    </h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.5;">
      ${files.map((file) => `<li style="margin: 6px 0;">${file.filename}</li>`).join("")}
    </ul>
  </div>

    
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
      attachments,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${files.length} file(s) to ${recipients.length} recipient(s)`,
    })
  } catch (error) {
    console.error("Upload/Email error:", error)
    return NextResponse.json({ error: "Failed to process files and send email" }, { status: 500 })
  }
}
