import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildReportHtml } from "@/lib/build-report-html";
import { generatePdfFromHtml } from "@/lib/generate-pdf";
import type { ReportRendererData } from "@/components/parent/MonthlyReportRenderer";

export const runtime = "nodejs";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    // @ts-ignore
    const role: string = session.user.realRole || session.user.role || "";
    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { reportId } = await params;

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
        attachments: { orderBy: { createdAt: "asc" }, select: { id: true, url: true, name: true } },
      },
    });

    if (!report) return new NextResponse("Not found", { status: 404 });

    // Parents can only download their own student's reports
    if (role === "PARENT" && report.student.parent?.id !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

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
    const summary = {
      totalAppHours,
      totalExternalHours: report.externalActivities.reduce((s, a: any) => s + (a.hoursSpent || 0), 0),
      totalSchoolHours: 0,
    };
    summary.totalSchoolHours = parseFloat((summary.totalAppHours + summary.totalExternalHours).toFixed(1));

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
      attachments: report.attachments ?? [],
    };

    const reportHtml = buildReportHtml(rendererData);
    const pdfBuffer = await generatePdfFromHtml(reportHtml);

    const monthName = MONTH_NAMES[report.month] || String(report.month);
    const filename = `${report.student.name.replace(/\s+/g, "_")}_${monthName}_${report.year}_Report.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF download error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
