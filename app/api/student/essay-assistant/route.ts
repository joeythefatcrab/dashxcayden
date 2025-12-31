import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const ESSAY_ASSISTANT_ID = process.env.ESSAY_WRITING_ASSISTANT_ID || "asst_REPLACE_ME";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, essayContent, prompt, threadId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get student to check grade level
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
      select: { grade: true },
    });

    // Create context for the assistant
    const context = {
      essayPrompt: prompt || "Essay assignment",
      currentDraft: essayContent || "",
      gradeLevel: student?.grade || 8,
      studentQuestion: message,
    };

    let thread;
    if (threadId) {
      // Continue existing conversation
      thread = { id: threadId };
    } else {
      // Create new thread
      thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: JSON.stringify(context),
          },
        ],
      });
    }

    // Add user's message if continuing thread
    if (threadId) {
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: JSON.stringify(context),
      });
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ESSAY_ASSISTANT_ID,
    });

    if (run.status !== "completed") {
      console.error("Assistant run failed:", run.status);
      return NextResponse.json(
        { error: "Assistant failed to respond" },
        { status: 500 }
      );
    }

    // Get the response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(
      (m) => m.role === "assistant" && m.run_id === run.id
    );

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No response from assistant" },
        { status: 500 }
      );
    }

    const response = assistantMessage.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text.value)
      .join("");

    return NextResponse.json({
      response,
      threadId: thread.id,
    });
  } catch (error) {
    console.error("Error with writing assistant:", error);
    return NextResponse.json(
      { error: "Failed to get assistant response" },
      { status: 500 }
    );
  }
}
