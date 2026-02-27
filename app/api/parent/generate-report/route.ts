import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdown } from "@/lib/markdown-stripper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const SYSTEM_PROMPT = `You are a HOMESCHOOL PROGRESS SUMMARY WRITER for APS (Alternative Education Programs) compliance.

Your job is to write the SUMMARY SECTION ONLY — 2 to 3 short paragraphs.

RULES:
- Plain text only (NO markdown, NO bullet points, NO headers, NO asterisks)
- Be factual, warm, and professional in tone
- Reference specific courses, total hours, and lesson counts from the provided data
- Mention attendance briefly (present days, any sick/vacation days)
- Keep it concise: 150 to 250 words total
- Do NOT invent information not present in the data
- Do NOT include the attendance calendar, subject table, or evaluation answers (those are rendered separately)

OUTPUT ONLY THE PARAGRAPHS.
NO LABELS. NO HEADERS. NO EXPLANATION.`;


export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, month, year } = body;

    if (!studentId || !month || !year) {
      return NextResponse.json(
        { error: "studentId, month, and year are required" },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Get student info
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        grade: true,
        parentId: true,
        parent: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (
      session.user.role === "PARENT" &&
      student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the report with all data
    const report = await db.monthlyReport.findUnique({
      where: {
        studentId_month_year: {
          studentId,
          month,
          year,
        },
      },
      include: {
        externalActivities: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Get course activity data
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const enrollments = await db.enrollment.findMany({
      where: { studentId },
      include: {
        curriculum: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    const attempts = await db.attempt.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            unit: {
              select: {
                curriculumId: true,
                title: true,
              },
            },
          },
        },
      },
    });

    // Get time log data for manually logged hours
    const timeLogs = await db.dailyTimeLog.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        curriculum: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    // Calculate course stats
    const courseStats = enrollments
      .map((enrollment) => {
        const courseAttempts = attempts.filter(
          (a) => a.lesson.unit.curriculumId === enrollment.curriculum.id
        );

        // Get manually logged time for this course
        const courseTimeLogs = timeLogs.filter(
          (log) => log.curriculumId === enrollment.curriculum.id
        );

        // Calculate total time: attempts (in seconds) + time logs (in minutes converted to seconds)
        const attemptTimeSeconds = courseAttempts.reduce(
          (sum: number, a: any) => sum + (a.timeSpent || 0),
          0
        );
        const loggedTimeSeconds = courseTimeLogs.reduce(
          (sum: number, log: any) => sum + (log.minutesSpent * 60),
          0
        );
        const totalTimeSeconds = attemptTimeSeconds + loggedTimeSeconds;

        // Skip course if no activity at all
        if (courseAttempts.length === 0 && courseTimeLogs.length === 0) {
          return null;
        }

        const uniqueLessons = new Set(courseAttempts.map((a) => a.lessonId));

        // Only calculate average score if there are attempts with scores
        const avgScore = courseAttempts.length > 0
          ? courseAttempts.reduce((sum: number, a: any) => sum + a.score, 0) /
            courseAttempts.length
          : null;

        // Get topics studied (unique unit titles)
        const topics = [
          ...new Set(courseAttempts.map((a) => a.lesson.unit.title)),
        ];

        return {
          name: enrollment.curriculum.name,
          subject: enrollment.curriculum.subject,
          lessonsCompleted: uniqueLessons.size,
          averageScore: avgScore ? Math.round(avgScore) : null,
          hoursSpent: parseFloat((totalTimeSeconds / 3600).toFixed(1)),
          topicsStudied: topics,
        };
      })
      .filter(Boolean);

    // Calculate total time from both attempts and time logs
    const totalAttemptSeconds = attempts.reduce(
      (sum: number, a: any) => sum + (a.timeSpent || 0),
      0
    );
    const totalLoggedSeconds = timeLogs.reduce(
      (sum: number, log: any) => sum + (log.minutesSpent * 60),
      0
    );
    const totalAppSeconds = totalAttemptSeconds + totalLoggedSeconds;
    const totalAppHours = parseFloat((totalAppSeconds / 3600).toFixed(1));

    const totalExternalHours = report.externalActivities.reduce(
      (sum: number, activity: any) => sum + (activity.hoursSpent || 0),
      0
    );

    const totalSchoolHours = parseFloat(
      (totalAppHours + totalExternalHours).toFixed(1)
    );

    // Prepare data for AI assistant
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Parse attendance data
    const attendance = (report.attendanceData as any) || { present: 0, sick: 0, vacation: 0 };

    // Build a compact summary payload for the AI (only what it needs)
    const summaryData = {
      student: { name: student.name, grade: student.grade },
      parent: { name: student.parent.name },
      period: { month: monthNames[month - 1], year },
      attendance: {
        present: attendance.present || 0,
        sick: attendance.sick || 0,
        vacation: attendance.vacation || 0,
        total: (attendance.present || 0) + (attendance.sick || 0) + (attendance.vacation || 0),
      },
      courses: courseStats.map((c: any) => ({
        name: c.name,
        subject: c.subject,
        lessonsCompleted: c.lessonsCompleted,
        hoursSpent: c.hoursSpent,
      })),
      totalAppHours,
      totalExternalHours,
      totalSchoolHours,
      externalActivityCount: report.externalActivities.length,
    };

    // Generate narrative summary using chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Write the progress summary for this student's monthly report:\n\n${JSON.stringify(summaryData, null, 2)}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
    });

    const reportContent = completion.choices[0]?.message?.content;

    if (!reportContent) {
      throw new Error("No report content generated");
    }

    // Strip markdown formatting for clean display
    const cleanedReportContent = stripMarkdown(reportContent);

    // Save the generated report
    const updatedReport = await db.monthlyReport.update({
      where: { id: report.id },
      data: {
        reportContent: cleanedReportContent,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      report: updatedReport,
      reportContent: cleanedReportContent,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
