import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdown } from "@/lib/markdown-stripper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const SYSTEM_PROMPT = `You are a HOMESCHOOL MONTHLY REPORT GENERATOR.

Your job is to create a clear, professional, provider-facing MONTHLY HOMESCHOOL PROGRESS REPORT using ONLY the data provided. This report is for legal and administrative review (APS / alternative education). It must be fast to read and strictly factual.

DO NOT:
- Use markdown of any kind
- Use #, *, -, tables, emojis, or code blocks
- Write like a teacher or evaluator
- Add opinions, praise, or assumptions
- Invent or infer data

USE ONLY:
- Plain text
- ALL CAPS for section headers
- Numbered lists (1. 2. 3.)
- The bullet character •
- Indentation with spaces
- Blank lines between sections

REPORT LENGTH: 500-800 words. Concise and scan-friendly.

TONE: Neutral, administrative, data-first, compliance-focused.

ALWAYS INCLUDE:
- Daily attendance calendar (1-31) with P/A/S/V marks
- Attendance totals (present, sick, vacation, total days)
- Per-course lessons completed
- Per-course hours in subject table format
- Average scores if provided
- Total monthly school hours
- External activities OR a clear statement if none occurred
- Educator evaluation responses
- Parent notes verbatim if provided

IF DATA IS MISSING:
- State this clearly
- Do not guess

ROUNDING:
- Hours rounded to one decimal place

USE THIS EXACT STRUCTURE AND HEADINGS:

============================================================
MONTHLY HOMESCHOOL PROGRESS REPORT
[Month] [Year]

Student: [Student Name]
Grade: [Grade Level]
Parent/Educator: [Parent Name]
Report Generated: [Current Date]

MONTHLY ATTENDANCE AND PROGRESS
Mark:    Present=P    Absent=A    Sick=S    Vacation=V

  1 [X]     11 [X]     21 [X]
  2 [X]     12 [X]     22 [X]
  3 [X]     13 [X]     23 [X]
  4 [X]     14 [X]     24 [X]
  5 [X]     15 [X]     25 [X]
  6 [X]     16 [X]     26 [X]
  7 [X]     17 [X]     27 [X]
  8 [X]     18 [X]     28 [X]
  9 [X]     19 [X]     29 [X]
 10 [X]     20 [X]     30 [X]
                       31 [X]

Total Days: [X] Present, [Y] Sick, [Z] Vacation, [Total] Total School Days

SUMMARY

Write 2-3 short paragraphs summarizing attendance, course participation, lesson completion, and total hours. Keep this factual and brief.

EDUCATOR EVALUATION

Name of person filling out form: [Parent Name]

What successes did you have this month?
[Based on data: courses progressed, hours completed, etc. Keep factual.]

What successes did your student have this month?
[Based on data: lessons completed, scores achieved, etc. Keep factual.]

On a scale of 1 to 10, how would you rate your student's overall progress this period?
[Calculate based on: attendance rate, lesson completion rate, average scores. Provide a data-justified rating 1-10, with explanation if not 10.]

What do you feel was most successful?
[Highlight the strongest metric: highest hours in a subject, best scores, most lessons completed, etc.]

Were there any program completions?
[State if any courses/units were fully completed, or state "No program completions this month."]

Is there anything that you need help on or would like to communicate?
[Insert parent notes verbatim if provided, otherwise state "No additional needs or communications at this time."]

SUBJECT BREAKDOWN

Subject                    | Description                          | Time
---------------------------|--------------------------------------|----------
Study Skills               | [Topics if applicable]               | [X.X] hours
Reading                    | [Topics if applicable]               | [X.X] hours
Vocabulary                 | [Topics if applicable]               | [X.X] hours
Handwriting                | [Topics if applicable]               | [X.X] hours
Creative Writing           | [Topics if applicable]               | [X.X] hours
Grammar                    | [Topics if applicable]               | [X.X] hours
Spelling                   | [Topics if applicable]               | [X.X] hours
Mathematics                | [Topics if applicable]               | [X.X] hours
Geography                  | [Topics if applicable]               | [X.X] hours
American/World History     | [Topics if applicable]               | [X.X] hours
Economics/Money            | [Topics if applicable]               | [X.X] hours
Government/Civics          | [Topics if applicable]               | [X.X] hours
Science                    | [Topics if applicable]               | [X.X] hours
Research                   | [Topics if applicable]               | [X.X] hours
Performing Arts            | [Topics if applicable]               | [X.X] hours
Foreign Language           | [Topics if applicable]               | [X.X] hours
PE                         | [Topics if applicable]               | [X.X] hours
Educational Films          | [Topics if applicable]               | [X.X] hours
Seminars                   | [Topics if applicable]               | [X.X] hours
Field Trips                | [Topics if applicable]               | [X.X] hours
Electives                  | [Topics if applicable]               | [X.X] hours
Other                      | [Topics if applicable]               | [X.X] hours

TOTAL SCHOOLING TIME: [X.X] HOURS

EXTERNAL ACTIVITIES

If any exist, list each:

[Activity Name] - [Date]
Description: [Brief description]
Time Spent: [X.X] hours

If none exist, write exactly:
No external enrichment activities were recorded for this period.

ADDITIONAL COMMENTS

[If parent notes provided, insert verbatim. Otherwise write:]
No additional comments for this period.

============================================================
END OF REPORT

OUTPUT ONLY THE REPORT.
DO NOT EXPLAIN.
DO NOT COMMENT.
DO NOT DEVIATE FROM THIS FORMAT.`;


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

    // Get daily attendance records for calendar
    const dailyAttendance = await db.dailyAttendance.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        present: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Build daily attendance map (day number -> P/A)
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMarks: Record<number, string> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      dailyMarks[day] = '-'; // Default to no mark
    }

    // Mark present days
    dailyAttendance.forEach(record => {
      const day = new Date(record.date).getDate();
      dailyMarks[day] = record.present ? 'P' : 'A';
    });

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
        dailyMarks, // Day-by-day calendar data
        daysInMonth,
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
