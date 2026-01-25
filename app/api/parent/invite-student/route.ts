import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { resend, SENDER_EMAIL } from "@/lib/email/resend";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore - role exists
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can invite students" }, { status: 403 });
    }

    const { studentEmail, studentName, curriculaIds } = await req.json();

    if (!studentEmail) {
      return NextResponse.json({ error: "Student email is required" }, { status: 400 });
    }

    // Check if student already exists with this email
    const existingUser = await db.user.findUnique({
      where: { email: studentEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Check for existing pending invitation
    const existingInvitation = await db.studentInvitation.findFirst({
      where: {
        studentEmail,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 409 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await db.studentInvitation.create({
      data: {
        parentId: session.user.id,
        studentEmail,
        studentName,
        token,
        curriculaIds: curriculaIds || [],
        expiresAt,
      },
    });

    // Get the correct base URL from the request headers
    const headersList = req.headers;
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = `${protocol}://${host}`;

    // Fallback to environment variable if host is not available
    const appUrl = host ? baseUrl : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Send invitation email
    const inviteUrl = `${appUrl}/accept-invite/${token}`;

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Student Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">You're Invited!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hi ${studentName || studentEmail},</p>

    <p style="font-size: 16px;">You've been invited to join a homeschool learning platform! Your parent/guardian has set up an account for you.</p>

    ${curriculaIds && curriculaIds.length > 0 ? `
    <p style="font-size: 16px;">You'll be automatically enrolled in ${curriculaIds.length} course${curriculaIds.length > 1 ? 's' : ''} when you accept this invitation.</p>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="background: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Accept Invitation</a>
    </div>

    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #f97316; word-break: break-all;">${inviteUrl}</p>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">This invitation expires in 7 days.</p>
  </div>

  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `.trim();

    try {
      // Only send email if Resend is configured
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: SENDER_EMAIL,
          to: studentEmail,
          subject: "You've been invited to join your homeschool platform!",
          html: emailContent,
        });
      } else {
        // Log invitation link for development
        console.log("\n=== STUDENT INVITATION ===");
        console.log(`To: ${studentEmail}`);
        console.log(`Invitation URL: ${inviteUrl}`);
        console.log("==========================\n");
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the whole request if email fails - invitation is still created
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        studentEmail: invitation.studentEmail,
        studentName: invitation.studentName,
        expiresAt: invitation.expiresAt,
        inviteUrl: process.env.NODE_ENV === "development" ? inviteUrl : undefined,
      },
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// Get all invitations for current parent
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore - role exists
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Only parents can view invitations" }, { status: 403 });
    }

    const invitations = await db.studentInvitation.findMany({
      where: { parentId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
