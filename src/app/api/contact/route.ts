import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = result.data;

    // Check SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("SMTP not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@lynxprompt.com",
      to: "info@lynxprompt.com",
      replyTo: email,
      subject: `[LynxPrompt Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                  <h1 style="margin: 0; font-size: 20px; font-weight: 600; color: #f8fafc;">
                    New Contact Form Submission
                  </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">From</p>
                    <p style="margin: 0; font-size: 16px; color: #f8fafc;">${name}</p>
                  </div>
                  
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Email</p>
                    <p style="margin: 0; font-size: 16px; color: #60a5fa;">
                      <a href="mailto:${email}" style="color: #60a5fa; text-decoration: none;">${email}</a>
                    </p>
                  </div>
                  
                  <div style="margin-bottom: 24px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Subject</p>
                    <p style="margin: 0; font-size: 16px; color: #f8fafc;">${subject}</p>
                  </div>
                  
                  <div>
                    <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Message</p>
                    <div style="background-color: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px;">
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Footer -->
                <div style="padding: 16px 32px; background-color: rgba(0,0,0,0.2); text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #64748b;">
                    Reply directly to this email to respond to ${name}
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}


