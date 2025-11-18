import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { resend, SENDER_EMAIL } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    const testEmail = email || session.user.email;

    if (!testEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: "Resend is not configured. Please set RESEND_API_KEY in your .env.local file.",
        configured: false,
      }, { status: 400 });
    }

    // Send test email
    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: testEmail,
      subject: "Test Email from Homeschool App",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Email Setup Successful!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi there!</p>

    <p style="font-size: 16px;">This is a test email from your Homeschool SaaS platform. If you're seeing this, your Resend integration is working correctly! 🎉</p>

    <div style="background: white; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;"><strong>Sent from:</strong> ${SENDER_EMAIL}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Sent to:</strong> ${testEmail}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <p style="font-size: 16px; margin-top: 30px;">You can now send:</p>
    <ul style="font-size: 16px;">
      <li>Student invitation emails</li>
      <li>Parent digest emails (daily/weekly)</li>
      <li>Any other notifications</li>
    </ul>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">Next steps: Update RESEND_FROM_EMAIL to use your own domain for production.</p>
  </div>

  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
    <p>Homeschool SaaS Platform</p>
  </div>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      emailId: result.data?.id,
      sentTo: testEmail,
      configured: true,
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);

    return NextResponse.json({
      error: error.message || "Failed to send test email",
      details: error.response?.body || error.toString(),
      configured: !!process.env.RESEND_API_KEY,
    }, { status: 500 });
  }
}
