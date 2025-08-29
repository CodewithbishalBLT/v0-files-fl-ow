import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get("email") as string

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

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
      to: email,
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
  
  <!-- Footer -->
  <p style="font-size: 14px; color: #6b7280; margin-top: 32px; line-height: 1.5;">
    Best regards, <br>
    <strong style="color: #111827;">FilesFlow</strong>  
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
      message: `Successfully sent ${files.length} file(s) to ${email}`,
    })
  } catch (error) {
    console.error("Upload/Email error:", error)
    return NextResponse.json({ error: "Failed to process files and send email" }, { status: 500 })
  }
}
