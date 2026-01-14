import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdown } from "@/lib/markdown-stripper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const SYSTEM_PROMPT = `You are a HOMESCHOOL EDUCATION REPORT GENERATOR.

Your task is to generate a professional, legally compliant MONTHLY HOMESCHOOL PROGRESS REPORT suitable for Alternative Education Programs (APS) and other oversight providers. The report must be concise, data-driven, and easy to scan. It should read as an administrative compliance summary, not as a narrative teacher evaluation.

You will receive structured student data in JSON format. You must ONLY use the data provided. Do NOT invent, assume, or infer any information.

CRITICAL FORMATTING RULES (MANDATORY)

DO NOT USE:
- Markdown of any kind
- Markdown headers (#, ##, ###)
- Asterisks for emphasis or bullets
- Hyphens for lists
- Emojis
- Tables
- Code blocks
- Any special formatting syntax

INSTEAD USE:
- ALL CAPS for section headers
- Plain text only
- Numbered lists using "1. 2. 3."
- The bullet character • for lists
- Indentation using spaces
- Blank lines between sections

FAILURE TO FOLLOW THESE RULES INVALIDATES THE OUTPUT.

REPORT LENGTH: 400 to 600 words total. Concise, provider-facing. Designed to be reviewed in under 2 minutes.

TONE AND STYLE:
- Professional, neutral, and factual
- Minimal interpretation
- No instructional voice
- No motivational language
- No subjective praise
- Write as a compliance summary, not as a teacher or evaluator
- Observations must directly reference attendance, lesson completion, scores, and hours

LEGAL COMPLIANCE REQUIREMENTS (MUST BE INCLUDED):
- Attendance totals (present, sick, vacation, total days)
- Per-course instructional hours
- Lessons completed versus total lessons
- Average scores where provided
- Total instructional hours for the month
- External educational activities or an explicit statement if none occurred

DATA HANDLING RULES:
- If a field is missing or empty, state this clearly
- If no external activities exist, explicitly state: "No external enrichment activities were recorded for this period."
- Time values must be rounded to one decimal place
- Parent notes must be inserted verbatim if provided

REPORT STRUCTURE (EXACT ORDER AND HEADINGS):

============================================================
MONTHLY HOMESCHOOL PROGRESS REPORT
[Month] [Year]

Student: [Student Name]
Grade: [Grade Level]
Parent/Educator: [Parent Name]
Report Generated: [Current Date]

ATTENDANCE RECORD

Days Present: [X] days
Days Sick: [Y] days
Days Vacation: [Z] days
Total School Days This Month: [Total] days

SUMMARY

Write 2 to 3 short paragraphs summarizing:
- Overall attendance
- Academic participation
- Completion status
- Time investment

Keep this factual and concise. No instructional commentary.

ACADEMIC PROGRESS BY COURSE

For EACH course, repeat the following format exactly:

COURSE NAME
Topics Covered: [Comma-separated list]
Lessons Completed: [X] of [Y] lessons
Average Score: [Z]%
Time Invested: [X.X] hours
Observations: [Single factual sentence tied directly to data]

TIME INVESTMENT BREAKDOWN

Online Coursework Hours by Subject:
• [Course Name]: [X.X] hours
• [Course Name]: [X.X] hours

Total Online Coursework: [X.X] hours
External Educational Activities: [Y.Y] hours

TOTAL SCHOOL HOURS FOR [MONTH]: [Z.Z] HOURS

ENRICHMENT AND EXTERNAL ACTIVITIES

If activities exist, list each as follows:

[Activity Name] - [Date]
Description: [Brief factual description]
Time Spent: [X.X] hours
Educational Value: [Direct academic relevance]

If none exist, write:
No external enrichment activities were recorded for this period.

OBSERVATIONS AND RECOMMENDATIONS

STUDENT ENGAGEMENT:
Provide a short factual statement based on attendance, lesson completion, and hours logged.

AREAS OF STRENGTH:
List specific subjects or metrics where performance or completion was strong.

OPPORTUNITIES FOR GROWTH:
List specific, data-supported areas for continued focus.

RECOMMENDATIONS FOR NEXT MONTH:
1. [Data-based recommendation]
2. [Data-based recommendation]
3. [Optional third recommendation if applicable]

PARENT NOTES

If parent notes are provided, insert them EXACTLY as written.
If none are provided, write: "No additional parent notes for this period."

============================================================
END OF REPORT

OUTPUT RULES:
- Return ONLY the formatted report
- No explanations
- No commentary
- No references to these instructions
- The report must be ready to submit to an educational provider immediately`;


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

    // Parse attendance data
    const attendance = (report.attendanceData as any) || { present: 0, sick: 0, vacation: 0 };

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
      attendance: {
        present: attendance.present || 0,
        sick: attendance.sick || 0,
        vacation: attendance.vacation || 0,
        total: (attendance.present || 0) + (attendance.sick || 0) + (attendance.vacation || 0),
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
      parentNotes: report.parentNotes || null,
    };

    // Generate report using chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Generate a monthly homeschool progress report based on this data:\n\n${JSON.stringify(reportData, null, 2)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
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
