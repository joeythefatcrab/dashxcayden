import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// This will be replaced with the actual assistant ID once created
const PROGRESS_ASSISTANT_ID = process.env.PROGRESS_ASSISTANT_ID || "";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI insights not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { studentId, studentName, stats, messages, type } = body;

    // Verify access to student
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check permission
    if (
      session.user.role === "PARENT" &&
      student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch detailed progress data
    const detailedAttempts = await db.attempt.findMany({
      where: { studentId },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                curriculum: {
                  select: {
                    name: true,
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Build context message
    let contextMessage = `Student: ${studentName}

CURRENT STATISTICS:
- Enrolled Courses: ${stats.totalEnrollments}
- Total Lesson Attempts: ${stats.totalAttempts}
- Overall Average Score: ${stats.avgScore}%
- Recent Average (last 10): ${stats.recentAvg}%
- Trend: ${stats.recentAvg > stats.avgScore ? "Improving ↗" : stats.recentAvg < stats.avgScore ? "Declining ↘" : "Stable →"}

COURSE BREAKDOWN:
${stats.curriculaProgress
  .map(
    (c: any) =>
      `- ${c.name}${c.subject ? ` (${c.subject})` : ""}: ${c.percentComplete}% complete (${c.completedLessons}/${c.totalLessons} lessons)${c.avgScore > 0 ? `, ${c.avgScore}% average` : ""}`
  )
  .join("\n")}

RECENT ACTIVITY (Last ${Math.min(detailedAttempts.length, 10)} attempts):
${detailedAttempts
  .slice(0, 10)
  .map(
    (a: any) =>
      `- ${a.lesson.title} (${a.lesson.unit.curriculum.name}): ${a.score}% (${a.earned}/${a.maxScore} pts) - ${new Date(a.createdAt).toLocaleDateString()}`
  )
  .join("\n")}`;

    // Use direct chat completions for better control
    const systemPrompt = `You are an AI educational progress analyst for DashX Cayden, a homeschool curriculum platform. Your role is to analyze student progress data and provide helpful insights to parents and instructors.

When generating reports or answering questions, focus on:
1. Identifying patterns in performance
2. Highlighting strengths and areas needing attention
3. Providing actionable recommendations
4. Being encouraging while being honest about challenges
5. Suggesting specific interventions when needed

Tone: Professional, supportive, data-informed, and constructive.`;

    const userPrompt = type === "initial"
      ? `Please analyze this student's progress and provide a comprehensive progress report. Include:

1. **Overall Summary** (2-3 sentences about their progress)
2. **Strengths** (What they're doing well)
3. **Areas for Improvement** (Specific challenges with data)
4. **Recommendations** (Actionable steps for parents/instructors)
5. **Encouragement** (Positive note to end on)

Format the report clearly with headers and bullet points.

${contextMessage}`
      : `${contextMessage}

Previous conversation:
${messages.map((m: any) => `${m.role === "user" ? "Parent" : "AI"}: ${m.content}`).join("\n\n")}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      throw new Error("No response generated");
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Error generating progress insights:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
