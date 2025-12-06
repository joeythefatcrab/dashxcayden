import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// The Loopi Assistant ID
const LOOPI_ASSISTANT_ID = "asst_bdBfXJGWtsRU35VLMgF0Dsqe";

/**
 * Run the Loopi Assistant with a user message
 */
async function runLoopi(userMessage: string, threadId?: string) {
  let thread;

  if (threadId) {
    // Continue existing conversation
    thread = { id: threadId };

    // Add the new user message to the existing thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userMessage,
    });
  } else {
    // Create a new thread with the user message
    thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });
  }

  // Run the Loopi assistant on the thread
  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: LOOPI_ASSISTANT_ID,
  });

  if (run.status !== "completed") {
    throw new Error(`Assistant run failed with status: ${run.status}`);
  }

  // Fetch all messages and find the latest assistant reply
  const messages = await openai.beta.threads.messages.list(thread.id);
  const latestAssistantMessage = messages.data.find((m) => m.role === "assistant");

  if (!latestAssistantMessage) {
    throw new Error("No assistant response found");
  }

  // Extract text from the message content
  const text = latestAssistantMessage.content
    .filter((part) => part.type === "text")
    .map((part) => (part as any).text.value)
    .join("\n");

  return {
    message: text || "Sorry, I couldn't generate a response.",
    threadId: thread.id,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "AI chat is not configured",
          details: "OPENAI_API_KEY is not set",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, threadId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];

    if (!latestUserMessage || latestUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Run the Loopi assistant
    const { message, threadId: newThreadId } = await runLoopi(
      latestUserMessage.content,
      threadId
    );

    return NextResponse.json({
      success: true,
      message,
      threadId: newThreadId,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
