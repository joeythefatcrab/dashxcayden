import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    const { studentId } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          quote: "Keep learning, keep growing! You're doing great.",
        },
        { status: 200 }
      );
    }

    // Get the last 10 quotes for this student to avoid repetition
    const recentQuotes = await db.dailyQuote.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { quote: true },
    });

    const recentQuotesList = recentQuotes.map(q => q.quote).join("\n- ");

    const userMessage = recentQuotes.length > 0
      ? `Please give me a fresh, unique motivational quote for today. Here are the quotes I've received recently - DO NOT repeat any of these or create similar variations:

RECENT QUOTES TO AVOID:
- ${recentQuotesList}

Generate a completely different quote with a new theme and perspective.`
      : "Please give me a motivational quote for today.";

    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: userMessage,
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

    let quote = latestAssistantMessage.content
      .filter((part) => part.type === "text")
      .map((part) => (part as any).text.value)
      .join("\n");

    // Remove any quote marks the AI might have added
    quote = quote.replace(/^["']|["']$/g, '').trim();

    // Save the quote to database
    await db.dailyQuote.create({
      data: {
        studentId,
        quote,
      },
    });

    // Clean up old quotes (keep only last 15)
    const allQuotes = await db.dailyQuote.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (allQuotes.length > 15) {
      const quotesToDelete = allQuotes.slice(15);
      await db.dailyQuote.deleteMany({
        where: {
          id: { in: quotesToDelete.map(q => q.id) },
        },
      });
    }

    return NextResponse.json({
      quote: quote || "Every day is a new opportunity to learn something amazing!",
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
