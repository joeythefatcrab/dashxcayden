import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const session = await auth();

  // Only superadmins can create invites
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate invite code
    const inviteCode = crypto.randomBytes(16).toString("hex");

    // Create invite (store in User with pending status)
    const invite = await db.user.create({
      data: {
        email,
        role,
        name: "Pending",
        password: inviteCode, // Temporary - will be replaced when they set password
      },
    });

    // Get the correct base URL from the request headers
    const headersList = request.headers;
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    const inviteUrl = `${baseUrl.replace(/\/+$/, "")}/accept-invite?code=${inviteCode}&email=${encodeURIComponent(email)}`;

    // Send invite email if Resend is configured
    let emailSent = false;
    if (isResendConfigured()) {
      try {
        await resend.emails.send({
          from: SENDER_EMAIL,
          to: email,
          subject: "You've been invited to join as an Admin",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1f2937;">You've been invited as an Admin</h2>
              <p style="color: #4b5563;">A super admin has created an account for you. Click the link below to set your password and get started.</p>
              <a href="${inviteUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Accept Invite &amp; Set Password
              </a>
              <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${inviteUrl}</p>
              <p style="color: #9ca3af; font-size: 12px;">This link is tied to your email address (${email}).</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Non-fatal — still return the invite URL so it can be shared manually
      }
    }

    return NextResponse.json({
      success: true,
      inviteUrl,
      inviteCode,
      emailSent,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
