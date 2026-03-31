import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { EssaySubmissionAlert } from "@/emails/EssaySubmissionAlert";
import { render } from "@react-email/render";
import { format } from "date-fns";

// POST /api/student/my-checklist/[itemId]
// Body: { enrollmentId, status, content? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { enrollmentId, status, content } = await req.json();
    if (!enrollmentId || !status) {
      return NextResponse.json({ error: "enrollmentId and status required" }, { status: 400 });
    }

    const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "SUBMITTED", "OPT_OUT", "MOVE"];
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify enrollment exists
    const enrollment = await db.programEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { include: { parent: { select: { id: true, email: true, name: true, notifyEmail: true, emailPrefsJson: true } } } } },
    });
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    // Upsert completion
    const completion = await db.programItemCompletion.upsert({
      where: { enrollmentId_itemId: { enrollmentId, itemId } },
      update: {
        status,
        content: content ?? undefined,
        completedAt: status === "DONE" || status === "SUBMITTED" ? new Date() : undefined,
      },
      create: {
        enrollmentId,
        itemId,
        status,
        content: content ?? null,
        completedAt: status === "DONE" || status === "SUBMITTED" ? new Date() : null,
      },
    });

    // Send essay submission alert to parent when status = SUBMITTED
    if (status === "SUBMITTED" && isResendConfigured()) {
      const parent = enrollment.student?.parent;
      if (parent?.notifyEmail && parent.email) {
        let prefs: Record<string, boolean> = {};
        try { prefs = JSON.parse(parent.emailPrefsJson || "{}"); } catch {}
        const essayAlerts = prefs.essayAlerts !== false; // default true

        if (essayAlerts) {
          const item = await db.programChecklistItem.findUnique({ where: { id: itemId }, select: { title: true } });
          const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
          const enrollmentProgramId = enrollment.programId;
          try {
            const html = await render(
              EssaySubmissionAlert({
                parentName: parent.name || "Parent",
                studentName: enrollment.student?.name || "Your student",
                essayTitle: item?.title || "Essay",
                submittedAt: format(new Date(), "MMM d, yyyy 'at' h:mm a"),
                reviewUrl: `${appUrl}/programs/${enrollmentProgramId}/submissions`,
              })
            );
            await resend.emails.send({
              from: SENDER_EMAIL,
              to: parent.email,
              subject: `${enrollment.student?.name || "Your student"} submitted an essay for review`,
              html,
            });
          } catch (emailErr) {
            console.error("Essay alert email failed:", emailErr);
            // Non-fatal — don't fail the whole request
          }
        }
      }
    }

    return NextResponse.json(completion);
  } catch (error) {
    console.error("my-checklist POST error:", error);
    return NextResponse.json({ error: "Failed to update completion" }, { status: 500 });
  }
}
