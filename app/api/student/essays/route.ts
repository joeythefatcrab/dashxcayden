import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Essay Grading Assistant ID
const ESSAY_GRADING_ASSISTANT_ID = process.env.ESSAY_GRADING_ASSISTANT_ID || "asst_REPLACE_ME";

// AI Grading Function
async function gradeEssayWithAI(prompt: string, essayContent: string, gradeLevel: number) {
  try {
    // Create a thread with the grading request
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            prompt: prompt,
            essay: essayContent,
            gradeLevel: gradeLevel,
          }),
        },
      ],
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ESSAY_GRADING_ASSISTANT_ID,
    });

    if (run.status !== "completed") {
      console.error("Assistant run failed:", run.status);
      return null;
    }

    // Get the response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find((m) => m.role === "assistant");

    if (!assistantMessage) {
      console.error("No assistant response found");
      return null;
    }

    // Parse the JSON response
    const content = assistantMessage.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text.value)
      .join("");

    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const result = JSON.parse(jsonContent);
    return result;
  } catch (error) {
    console.error("Error grading essay with AI:", error);
    return null;
  }
}

// GET - Fetch essay submission
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const itemId = searchParams.get("itemId");

    if (!studentId || !itemId) {
      return NextResponse.json(
        { error: "studentId and itemId are required" },
        { status: 400 }
      );
    }

    // Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find submission
    const submission = await db.essaySubmission.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching essay submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// POST - Create or update essay submission
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, lessonId, itemId, content, status, prompt } = body;

    if (!studentId || !lessonId || !itemId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if submission already exists
    const existing = await db.essaySubmission.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    // Don't allow editing after submission
    if (existing && existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot edit submitted essay" },
        { status: 400 }
      );
    }

    // If submitting (not just saving draft), trigger AI grading
    let aiGradeData = {};
    if (status === "SUBMITTED" && !existing) {
      try {
        // Get essay prompt - first try from Item table, fallback to passed prompt
        let essayPrompt = prompt || "Write an essay about this topic";

        const item = await db.item.findUnique({
          where: { id: itemId },
          select: { prompt: true },
        });

        if (item?.prompt) {
          essayPrompt = item.prompt;
        }

        const studentData = await db.student.findUnique({
          where: { id: studentId },
          select: { grade: true },
        });

        if (studentData) {
          console.log("Starting AI grading for essay...");
          const gradeResult = await gradeEssayWithAI(
            essayPrompt,
            content,
            studentData.grade || 8 // Default to 8th grade if not set
          );

          if (gradeResult) {
            console.log("AI grading successful:", gradeResult.grade);
            aiGradeData = {
              aiGrade: gradeResult.grade,
              aiStrengths: JSON.stringify(gradeResult.strengths),
              aiImprovements: JSON.stringify(gradeResult.improvements),
              aiSummary: gradeResult.summary,
              aiParentNote: gradeResult.parentNote,
              aiGradedAt: new Date(),
            };
          } else {
            console.log("AI grading returned null");
          }
        }
      } catch (error) {
        console.error("AI grading failed:", error);
        // Continue without AI grading if it fails
      }
    }

    // Create or update submission
    const submission = await db.essaySubmission.upsert({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
      update: {
        content,
        status: status || "DRAFT",
        submittedAt: status === "SUBMITTED" ? new Date() : existing?.submittedAt,
        ...aiGradeData,
      },
      create: {
        studentId,
        lessonId,
        itemId,
        content,
        status: status || "DRAFT",
        submittedAt: status === "SUBMITTED" ? new Date() : null,
        ...aiGradeData,
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error saving essay submission:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
