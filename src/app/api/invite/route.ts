import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { to_email, from_name, invite_link } = await req.json();

    if (!to_email || !from_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // SMTP Configuration from environment variables
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465 || process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "TilawaNow.vercel.app";

    // Email HTML Template (User provided)
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You Have Been Invited</title>
</head>

<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
                <tr>
                  <td style="background-color:#648CB4;padding:32px 20px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td style="padding-right:12px;">
                          <img src="https://raw.githubusercontent.com/tXHsesaMSeckjpitHoikGaqDGnfiuvnslva/Logo---Tadabbur---quran/refs/heads/main/tadabbur/favicon-160x160.png"
                               alt="Tadabbur Logo"
                               width="40"
                               style="display:block;height:auto;">
                        </td>
                        <td style="font-size:20px;font-weight:600;color:#ffffff;line-height:1;">
                          TilawaNow
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

          <!-- Content -->
          <tr>
            <td style="padding:50px 40px;">
              <h2 style="margin:0 0 20px;font-size:24px;font-weight:600;color:#111318;">
                You have been invited
              </h2>

              <p style="margin:0 0 20px;font-size:16px;color:#111318;line-height:1.6;">
                <strong>${from_name}</strong> invited you to create a user on <strong>${siteUrl}</strong>.
                Follow the link below to accept the invitation and start your journey with the Qur’an.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin:35px 0;">
                <a href="${invite_link}"
                   style="display:inline-block;padding:14px 30px;background:#648CB4;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;">
                  Accept the invitation
                </a>
              </div>

              <p style="margin:0;font-size:15px;color:#111318;line-height:1.6;">
                If you were not expecting this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111318;padding:30px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:#ffffff;">
                © ${new Date().getFullYear()} TilawaNow. All rights reserved.
              </p>
              <p style="margin:0;font-size:13px;color:#a0a0a0;">
                This is an automated invitation email sent via Nodemailer. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email
    await transporter.sendMail({
      from: `"TilawaNow" <${process.env.SMTP_USER}>`,
      to: to_email,
      subject: `${from_name} invited you to TilawaNow`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
