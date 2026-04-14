import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill in all fields" },
        { status: 400 }
      );
    }

    // SMTP Configuration
    const port = Number(process.env.SMTP_PORT) || 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465 || process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 1. Send Email to Admin (You)
    const adminHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #648CB4;">New Contact Message - TilawaNow</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #648CB4; margin-top: 20px;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">Received at ${new Date().toLocaleString()}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"TilawaNow Support" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: adminHtml,
    });

    // 2. Send Auto-Reply to User
    const userHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #648CB4; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
           <h1 style="color: white; margin: 0;">TilawaNow</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #eee; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Assalamu alaikum <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to us. We have received your message regarding "<strong>${subject}</strong>".</p>
          <p>Our team typically responds within 24-48 hours. We appreciate your patience and your interest in Tadabbur.</p>
          <div style="background: #f4f7f9; padding: 15px; border-radius: 5px; margin: 20px 0; font-style: italic;">
            "Your message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"
          </div>
          <p>Wishing you a blessed journey with the Qur’an.</p>
          <p>Best regards,<br />The TilawaNow Team</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"TilawaNow" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "We received your message - TilawaNow",
      html: userHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
