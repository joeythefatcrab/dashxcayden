import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { stripMarkdown } from "@/lib/markdown-stripper";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Progress Insights Assistant ID
const PROGRESS_ASSISTANT_ID = "asst_PVatp1jFEG4WGkJ4kGiZn8lT";

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
    const { studentId, studentName, stats, messages, type, threadId } = body;

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

    let thread;
    let userMessage = "";

    if (type === "initial") {
      userMessage = `Please analyze this student's progress and provide a comprehensive progress report.

${contextMessage}`;
    } else {
      // Chat message
      const lastUserMessage = messages[messages.length - 1];
      userMessage = `${contextMessage}

Parent's question: ${lastUserMessage.content}`;
    }

    // Create or use existing thread
    if (threadId) {
      thread = { id: threadId };
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userMessage,
      });
    } else {
      thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: PROGRESS_ASSISTANT_ID,
    });

    if (run.status !== "completed") {
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }

    // Fetch the response
    const messagesResponse = await openai.beta.threads.messages.list(thread.id);
    const latestAssistantMessage = messagesResponse.data.find((m) => m.role === "assistant");

    if (!latestAssistantMessage) {
      throw new Error("No assistant response found");
    }

    // Extract text from the message content
    const text = latestAssistantMessage.content
      .filter((part) => part.type === "text")
      .map((part) => (part as any).text.value)
      .join("\n");

    // Strip markdown formatting for clean display
    const cleanedText = stripMarkdown(text);

    return NextResponse.json({
      success: true,
      message: cleanedText || "Sorry, I couldn't generate a response.",
      threadId: thread.id,
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
