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
    const role: string = session.user.realRole || session.user.role || "";
    // @ts-ignore
    const isImpersonating = !!session.user.isImpersonating;
    if (!isImpersonating && !["PARENT", "ADMIN", "SUPERADMIN"].includes(role)) {
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

    if (role === "PARENT" && !isImpersonating && report.student.parent?.id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark as submitted (idempotent)
    const updatedReport = await db.monthlyReport.update({
      where: { id: reportId },
      data: { submittedAt: report.submittedAt ?? new Date() },
    });

    // ── Build course stats (same logic as monthly-report GET) ──────────────────
    const startDate = new Date(report.year, report.month - 1, 1);
    const endDate = new Date(report.year, report.month, 0, 23, 59, 59);
    const studentId = report.studentId;

    const dailyAttendance = await db.dailyAttendance.findMany({
      where: { studentId, date: { gte: startDate, lte: endDate } },
      select: { date: true, present: true },
      orderBy: { date: "asc" },
    });

    const monthName = MONTH_NAMES[report.month] || String(report.month);

    // ── Send email notification to opted-in admins ─────────────────────────────
    let emailResult: { sent: number; error?: string } = { sent: 0 };

    if (isResendConfigured()) {
      let notifyAdmins: { email: string; name: string | null }[] = [];
      try {
        notifyAdmins = await db.$queryRaw<{ email: string; name: string | null }[]>`
          SELECT email, name FROM "User"
          WHERE role IN ('ADMIN', 'SUPERADMIN')
            AND "notifyOnReportSubmission" = true
            AND email <> ''
        `;
      } catch (err) {
        console.error("Could not query notifyOnReportSubmission (migration pending?):", err);
      }

      if (notifyAdmins.length > 0) {
        const appUrl = process.env.NEXTAUTH_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const evalData = report.educatorEvaluation as Record<string, string> | null;

        // Compute attendance counts from dailyAttendance records (same logic as MonthlyReportRenderer)
        const attendanceRaw = report.attendanceData as { present?: number; sick?: number; vacation?: number; days?: Record<string, { status: string }>; cleared?: string[] } | null;
        const clearedSet = new Set<string>(attendanceRaw?.cleared ?? []);
        const dailyMarksForEmail: Record<string, { status: string }> = {};
        dailyAttendance.forEach((r) => {
          const key = typeof r.date === "string" ? (r.date as string).substring(0, 10) : (r.date as Date).toISOString().substring(0, 10);
          if (clearedSet.has(key)) return;
          dailyMarksForEmail[key] = { status: r.present ? "P" : "A" };
        });
        if (attendanceRaw?.days) {
          for (const [key, entry] of Object.entries(attendanceRaw.days)) {
            dailyMarksForEmail[key] = entry;
          }
        }
        let presentCount = 0, sickCount = 0, vacationCount = 0;
        for (const entry of Object.values(dailyMarksForEmail)) {
          if (entry.status === "P") presentCount++;
          else if (entry.status === "S") sickCount++;
          else if (entry.status === "V") vacationCount++;
        }
        const hasDailyData = Object.keys(dailyMarksForEmail).length > 0;
        const computedAttendance = {
          present: hasDailyData ? presentCount : (attendanceRaw?.present ?? 0),
          sick: hasDailyData ? sickCount : (attendanceRaw?.sick ?? 0),
          vacation: hasDailyData ? vacationCount : (attendanceRaw?.vacation ?? 0),
        };

        const pdfUrl = `${appUrl}/api/reports/${report.id}/pdf`;
        const emailHtml = await render(
          MonthlyReportEmail({
            studentName: report.student.name,
            parentName: report.student.parent?.name || "Parent",
            month: monthName,
            year: report.year,
            grade: String(report.student.grade ?? ""),
            attendanceData: computedAttendance,
            parentNotes: report.parentNotes || "",
            educatorEvaluation: evalData,
            externalActivities: report.externalActivities.map((a) => ({
              title: a.title,
              category: a.category || "",
              hoursSpent: a.hoursSpent ?? undefined,
              description: a.description || "",
            })),
            reportUrl: `${appUrl}/monthly-reports`,
            pdfUrl,
          })
        );

        const subject = `Monthly Report Submitted — ${report.student.name} (${monthName} ${report.year})`;

        try {
          if (notifyAdmins.length === 1) {
            await resend.emails.send({
              from: SENDER_EMAIL,
              to: notifyAdmins[0].email,
              subject,
              html: emailHtml,
            });
          } else {
            await resend.batch.send(
              notifyAdmins.map((admin) => ({
                from: SENDER_EMAIL,
                to: admin.email,
                subject,
                html: emailHtml,
              }))
            );
          }
          emailResult = { sent: notifyAdmins.length };
        } catch (err: any) {
          console.error("[submit-report] email send failed:", err);
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
