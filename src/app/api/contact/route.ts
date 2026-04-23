import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- Rate Limiting (in-memory, per-instance) ---
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // max 5 requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// --- HTML Sanitization ---
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill in all fields" },
        { status: 400 }
      );
    }

    // Input length validation
    if (name.length > 200 || email.length > 320 || subject.length > 500 || message.length > 5000) {
      return NextResponse.json(
        { error: "Input too long" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Sanitize all user inputs
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

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
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #648CB4; margin-top: 20px;">
          <p style="white-space: pre-wrap;">${safeMessage}</p>
        </div>
        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">Received at ${new Date().toLocaleString()}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"TilawaNow Support" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      replyTo: email, // Raw email for reply-to (not rendered in HTML)
      subject: `Contact Form: ${safeSubject}`,
      html: adminHtml,
    });

    // 2. Send Auto-Reply to User
    const truncatedMessage = safeMessage.substring(0, 100) + (safeMessage.length > 100 ? "..." : "");
    const userHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="background-color: #648CB4; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
           <h1 style="color: white; margin: 0;">TilawaNow</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #eee; border-top: 0; border-radius: 0 0 8px 8px;">
          <p>Assalamu alaikum <strong>${safeName}</strong>,</p>
          <p>Thank you for reaching out to us. We have received your message regarding "<strong>${safeSubject}</strong>".</p>
          <p>Our team typically responds within 24-48 hours. We appreciate your patience and your interest in TilawaNow.</p>
          <div style="background: #f4f7f9; padding: 15px; border-radius: 5px; margin: 20px 0; font-style: italic;">
            "Your message: ${truncatedMessage}"
          </div>
          <p>Wishing you a blessed journey with the Qur'an.</p>
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
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
