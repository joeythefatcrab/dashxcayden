import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { render } from "@react-email/render";
import { AdminAnnouncementEmail } from "@/emails/AdminAnnouncement";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const userRole: string = session.user.realRole || session.user.role || "";
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, recipientType, recipientIds, expiresAt, sendEmail } = body;

    if (!content || !recipientType) {
      return NextResponse.json(
        { error: "Content and recipient type are required" },
        { status: 400 }
      );
    }

    // Get sender's org info
    const sender = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, name: true, organization: { select: { name: true } } },
    });

    // Create the in-app message
    const message = await db.message.create({
      data: {
        title,
        content,
        senderId: session.user.id,
        recipientType,
        recipientIds: recipientIds || [],
        organizationId: sender?.organizationId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    // Email blast logic
    let emailResult: { sent: number; skipped: number; error?: string } = { sent: 0, skipped: 0 };

    if (sendEmail) {
      if (!isResendConfigured()) {
        emailResult = { sent: 0, skipped: 0, error: "RESEND_API_KEY not configured" };
      } else {
        try {
          // Build recipient query based on type and org scope
          const roleFilter: any = {};
          if (recipientType === "STUDENT") roleFilter.role = "STUDENT";
          else if (recipientType === "PARENT") roleFilter.role = "PARENT";
          else if (recipientType === "ADMIN") roleFilter.role = "ADMIN";
          // ALL = no role filter

          const orgFilter =
            userRole === "ADMIN" && sender?.organizationId
              ? { organizationId: sender.organizationId }
              : {};

          const recipients = await db.user.findMany({
            where: { ...roleFilter, ...orgFilter },
            select: { email: true },
          });

          const emails = recipients.map((r) => r.email).filter(Boolean) as string[];

          if (emails.length === 0) {
            emailResult = { sent: 0, skipped: 0 };
          } else {
            const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
            const html = await render(
              AdminAnnouncementEmail({
                title: title || "Announcement",
                content,
                senderName: sender?.name || "Admin",
                orgName: sender?.organization?.name ?? undefined,
                dashboardUrl: `${appUrl}/dashboard`,
              })
            );

            // Resend supports batch up to 100 per call
            const BATCH_SIZE = 100;
            let sentCount = 0;
            for (let i = 0; i < emails.length; i += BATCH_SIZE) {
              const chunk = emails.slice(i, i + BATCH_SIZE);
              const batch = chunk.map((to) => ({
                from: SENDER_EMAIL,
                to,
                subject: title || "Announcement",
                html,
              }));
              await resend.emails.send(batch as any);
              sentCount += chunk.length;
            }
            emailResult = { sent: sentCount, skipped: 0 };
          }
        } catch (err: any) {
          console.error("Email blast error:", err);
          emailResult = { sent: 0, skipped: 0, error: err?.message || "Email sending failed" };
        }
      }
    }

    return NextResponse.json({ ...message, emailResult });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    const where: any = {};
    if (session.user.role === "ADMIN") {
      where.organizationId = user?.organizationId;
    }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        readReceipts: { select: { userId: true, readAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
