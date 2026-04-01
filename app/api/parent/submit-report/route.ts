import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { render } from "@react-email/render";
import { MonthlyReportEmail } from "@/emails/MonthlyReportEmail";

export const runtime = "nodejs";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const role = session.user.realRole || session.user.role;
    if (role !== "PARENT" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reportId } = await req.json();
    if (!reportId) return NextResponse.json({ error: "reportId required" }, { status: 400 });

    // Load report with full data
    const report = await db.monthlyReport.findUnique({
      where: { id: reportId },
      include: {
        student: {
          select: {
            id: true, name: true, grade: true,
            parent: { select: { id: true, name: true, email: true } },
          },
        },
        externalActivities: { orderBy: { date: "asc" } },
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // Auth check: parent must own this student
    if (role === "PARENT" && report.student.parent?.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as submitted (idempotent — don't re-stamp if already submitted)
    const updatedReport = await db.monthlyReport.update({
      where: { id: reportId },
      data: { submittedAt: report.submittedAt ?? new Date() },
    });

    // Send email if Resend is configured
    let emailResult: { sent: number; error?: string } = { sent: 0 };

    if (isResendConfigured()) {
      // Find all admins/superadmins with notifyOnReportSubmission: true
      const notifyAdmins = await db.user.findMany({
        where: {
          role: { in: ["ADMIN", "SUPERADMIN"] },
          notifyOnReportSubmission: true,
          email: { not: "" },
        },
        select: { email: true, name: true },
      });

      if (notifyAdmins.length > 0) {
        const monthName = MONTH_NAMES[report.month] || String(report.month);
        const appUrl = process.env.NEXTAUTH_URL || "https://example.com";

        // Gather course stats for the email (reuse from existing data shape)
        // We don't re-run the full stats query here — pass what we have
        const evalData = report.educatorEvaluation as Record<string, string> | null;

        const html = await render(
          MonthlyReportEmail({
            studentName: report.student.name,
            parentName: report.student.parent?.name || "Parent",
            month: monthName,
            year: report.year,
            grade: String(report.student.grade ?? ""),
            attendanceData: report.attendanceData as any,
            parentNotes: report.parentNotes || "",
            educatorEvaluation: evalData,
            externalActivities: report.externalActivities.map((a) => ({
              title: a.title,
              category: a.category || "",
              hoursSpent: a.hoursSpent ?? undefined,
              description: a.description || "",
            })),
            reportUrl: `${appUrl}/monthly-reports`,
          })
        );

        // Attach the HTML as a printable file
        const attachment = Buffer.from(html).toString("base64");

        const emails = notifyAdmins.map((admin) => ({
          from: SENDER_EMAIL,
          to: admin.email,
          subject: `Monthly Report Submitted — ${report.student.name} (${monthName} ${report.year})`,
          html,
          attachments: [
            {
              filename: `${report.student.name.replace(/\s+/g, "_")}_${monthName}_${report.year}_Report.html`,
              content: attachment,
            },
          ],
        }));

        try {
          await resend.emails.send(emails as any);
          emailResult = { sent: emails.length };
        } catch (err: any) {
          console.error("Report notification email failed:", err);
          emailResult = { sent: 0, error: err?.message || "Email failed" };
        }
      }
    }

    return NextResponse.json({
      success: true,
      submittedAt: updatedReport.submittedAt,
      emailResult,
    });
  } catch (error) {
    console.error("submit-report error:", error);
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
