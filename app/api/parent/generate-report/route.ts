import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdown } from "@/lib/markdown-stripper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Monthly Report Generator Assistant ID
const REPORT_ASSISTANT_ID = process.env.MONTHLY_REPORT_ASSISTANT_ID || "asst_ZvIocbPkAZ6b6ztZacDEnhKJ";

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

    // Calculate course stats
    const courseStats = enrollments
      .map((enrollment) => {
        const courseAttempts = attempts.filter(
          (a) => a.lesson.unit.curriculumId === enrollment.curriculum.id
        );

        if (courseAttempts.length === 0) return null;

        const uniqueLessons = new Set(courseAttempts.map((a) => a.lessonId));
        const totalTime = courseAttempts.reduce(
          (sum: number, a: any) => sum + (a.timeSpent || 0),
          0
        );
        const avgScore =
          courseAttempts.reduce((sum: number, a: any) => sum + a.score, 0) /
          courseAttempts.length;

        // Get topics studied (unique unit titles)
        const topics = [
          ...new Set(courseAttempts.map((a) => a.lesson.unit.title)),
        ];

        return {
          name: enrollment.curriculum.name,
          subject: enrollment.curriculum.subject,
          lessonsCompleted: uniqueLessons.size,
          averageScore: Math.round(avgScore),
          hoursSpent: parseFloat((totalTime / 3600).toFixed(1)),
          topicsStudied: topics,
        };
      })
      .filter(Boolean);

    const totalAppSeconds = attempts.reduce(
      (sum: number, a: any) => sum + (a.timeSpent || 0),
      0
    );
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

    const reportData = {
      student: {
        name: student.name,
        grade: student.grade,
      },
      parent: {
        name: student.parent.name,
      },
      period: {
        month: monthNames[month - 1],
        year: year,
      },
      courses: courseStats,
      externalActivities: report.externalActivities.map((activity: any) => ({
        title: activity.title,
        description: activity.description,
        date: new Date(activity.date).toLocaleDateString(),
        hoursSpent: activity.hoursSpent,
        category: activity.category,
      })),
      totalAppHours,
      totalExternalHours,
      totalSchoolHours,
    };

    // Create a thread and send the data to the assistant
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: `Please generate a monthly homeschool progress report based on the following data:\n\n${JSON.stringify(reportData, null, 2)}`,
        },
      ],
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: REPORT_ASSISTANT_ID,
    });

    if (run.status !== "completed") {
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }

    const messagesResponse = await openai.beta.threads.messages.list(
      thread.id
    );
    const latestAssistantMessage = messagesResponse.data.find(
      (m) => m.role === "assistant"
    );

    if (!latestAssistantMessage) {
      throw new Error("No assistant response found");
    }

    const reportContent = latestAssistantMessage.content
      .filter((part) => part.type === "text")
      .map((part) => (part as any).text.value)
      .join("\n");

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
