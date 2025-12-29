import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Motivational Quote Assistant ID
const QUOTE_ASSISTANT_ID = "asst_cLokCr46rNobK1iFgPBEld0E";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          quote: "Keep learning, keep growing! You're doing great.",
        },
        { status: 200 }
      );
    }

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: "Please give me a motivational quote for today.",
        },
      ],
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: QUOTE_ASSISTANT_ID,
    });

    if (run.status !== "completed") {
      throw new Error(`Assistant run failed with status: ${run.status}`);
    }

    const messagesResponse = await openai.beta.threads.messages.list(thread.id);
    const latestAssistantMessage = messagesResponse.data.find((m) => m.role === "assistant");

    if (!latestAssistantMessage) {
      throw new Error("No assistant response found");
    }

    const text = latestAssistantMessage.content
      .filter((part) => part.type === "text")
      .map((part) => (part as any).text.value)
      .join("\n");

    return NextResponse.json({
      quote: text || "Every day is a new opportunity to learn something amazing!",
    });
  } catch (error) {
    console.error("Error fetching daily quote:", error);
    return NextResponse.json(
      {
        quote: "Keep learning, keep growing! You're doing great.",
      },
      { status: 200 }
    );
  }
}
