import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resend, SENDER_EMAIL, isResendConfigured } from "@/lib/email/resend";
import { render } from "@react-email/render";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { MonthlyReportEmail } from "@/emails/MonthlyReportEmail";
import { MonthlyReportRenderer } from "@/components/parent/MonthlyReportRenderer";
import type { ReportRendererData } from "@/components/parent/MonthlyReportRenderer";

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
    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(role)) {
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

    if (role === "PARENT" && report.student.parent?.id !== session.user.id) {
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

    const [enrollments, attempts, dailyTimeLogs, dailyAttendance] = await Promise.all([
      db.enrollment.findMany({
        where: { studentId },
        include: { curriculum: { select: { id: true, name: true, subject: true } } },
      }),
      db.attempt.findMany({
        where: { studentId, createdAt: { gte: startDate, lte: endDate } },
        include: { lesson: { select: { id: true, unit: { select: { curriculumId: true } } } } },
      }),
      db.dailyTimeLog.findMany({
        where: { studentId, date: { gte: startDate, lte: endDate } },
        select: { curriculumId: true, minutesSpent: true },
      }),
      db.dailyAttendance.findMany({
        where: { studentId, date: { gte: startDate, lte: endDate } },
        select: { date: true, present: true },
        orderBy: { date: "asc" },
      }),
    ]);

    // apsSubject map with graceful fallback
    const apsSubjectMap: Record<string, string | null> = {};
    try {
      const curriculaAps = await db.curriculum.findMany({
        where: { id: { in: enrollments.map((e) => e.curriculum.id) } },
        select: { id: true, apsSubject: true },
      });
      for (const c of curriculaAps) apsSubjectMap[c.id] = c.apsSubject ?? null;
    } catch { /* migration pending */ }

    const courseStats = enrollments.map((enrollment) => {
      const courseAttempts = attempts.filter(
        (a) => a.lesson.unit.curriculumId === enrollment.curriculum.id
      );
      const uniqueLessons = new Set(courseAttempts.map((a) => a.lessonId));
      const totalTimeSeconds = courseAttempts.reduce((s, a: any) => s + (a.timeSpent || 0), 0);
      const timeLogMinutes = dailyTimeLogs
        .filter((l) => l.curriculumId === enrollment.curriculum.id)
        .reduce((s, l) => s + l.minutesSpent, 0);
      const avgScore =
        courseAttempts.length > 0
          ? courseAttempts.reduce((s, a: any) => s + a.score, 0) / courseAttempts.length
          : 0;
      return {
        curriculumId: enrollment.curriculum.id,
        name: enrollment.curriculum.name,
        subject: enrollment.curriculum.subject,
        apsSubject: apsSubjectMap[enrollment.curriculum.id] ?? null,
        lessonsCompleted: uniqueLessons.size,
        averageScore: Math.round(avgScore),
        timeSpentHours: parseFloat(
          ((totalTimeSeconds + timeLogMinutes * 60) / 3600).toFixed(1)
        ),
      };
    });

    const totalAppHours = parseFloat(
      ((attempts.reduce((s, a: any) => s + (a.timeSpent || 0), 0) +
        dailyTimeLogs.reduce((s, l) => s + l.minutesSpent, 0) * 60) /
        3600
      ).toFixed(1)
    );
    const totalExternalHours = report.externalActivities.reduce(
      (s, a: any) => s + (a.hoursSpent || 0), 0
    );

    const summary = {
      totalAppHours,
      totalExternalHours,
      totalSchoolHours: parseFloat((totalAppHours + totalExternalHours).toFixed(1)),
    };

    // ── Render the actual report to HTML for the attachment ────────────────────
    const rendererData: ReportRendererData = {
      report: {
        id: report.id,
        attendanceData: report.attendanceData as any,
        parentNotes: report.parentNotes,
        educatorEvaluation: report.educatorEvaluation as any,
        reportContent: report.reportContent ?? null,
        externalActivities: report.externalActivities as any,
      },
      student: {
        id: report.student.id,
        name: report.student.name,
        grade: report.student.grade,
        parent: {
          name: report.student.parent?.name ?? null,
          email: report.student.parent?.email ?? "",
        },
      },
      month: report.month,
      year: report.year,
      courseStats,
      summary,
      dailyAttendance: dailyAttendance.map((d) => ({
        date: d.date instanceof Date ? d.date.toISOString() : String(d.date),
        present: d.present,
      })),
    };

    const reportBodyHtml = renderToStaticMarkup(
      React.createElement(MonthlyReportRenderer, { data: rendererData })
    );

    const monthName = MONTH_NAMES[report.month] || String(report.month);
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${report.student.name} — ${monthName} ${report.year} Report</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 0.75in; }
    }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; margin: 0; padding: 0; }
  </style>
</head>
<body>${reportBodyHtml}</body>
</html>`;

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
        const appUrl = process.env.NEXTAUTH_URL || "https://example.com";
        const evalData = report.educatorEvaluation as Record<string, string> | null;

        const emailHtml = await render(
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

        const attachment = Buffer.from(reportHtml).toString("base64");
        const filename = `${report.student.name.replace(/\s+/g, "_")}_${monthName}_${report.year}_Report.html`;
        const subject = `Monthly Report Submitted — ${report.student.name} (${monthName} ${report.year})`;

        try {
          if (notifyAdmins.length === 1) {
            await resend.emails.send({
              from: SENDER_EMAIL,
              to: notifyAdmins[0].email,
              subject,
              html: emailHtml,
              attachments: [{ filename, content: attachment }],
            });
          } else {
            await resend.batch.send(
              notifyAdmins.map((admin) => ({
                from: SENDER_EMAIL,
                to: admin.email,
                subject,
                html: emailHtml,
                attachments: [{ filename, content: attachment }],
              }))
            );
          }
          emailResult = { sent: notifyAdmins.length };
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
