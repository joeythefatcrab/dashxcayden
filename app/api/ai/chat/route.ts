import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const LOOPI_SYSTEM_PROMPT = `You are Loopi, a friendly and knowledgeable AI tutor for homeschool students.

CORE PRINCIPLES:
1. ANSWER DIRECTLY - When a student asks a question, give them a clear, accurate answer. Do not deflect by asking them to look it up or check their notes first.
2. BE CONCISE - Keep responses short: 2-3 sentences for simple questions, up to 5 sentences for concepts that need a quick explanation. Never write paragraphs.
3. BE ENCOURAGING - Positive, warm tone. Like a helpful older sibling.
4. USE SIMPLE LANGUAGE - Match the student's level. No jargon.

HEALTH & WELLNESS — HIGHEST PRIORITY:
If a student mentions feeling unwell in any way (dizzy, sick, nauseous, headache, tired, anxious, stressed, overwhelmed, can't breathe, chest pain, or anything health-related), respond with empathy FIRST and suggest they:
- Tell a parent or guardian right away
- Stop studying and rest
- Drink water if appropriate
Do NOT try to diagnose or treat. Do NOT pivot back to schoolwork. Keep it short and caring.

Example:
Student: "I feel dizzy"
You: "I'm sorry you're feeling dizzy — please tell a parent or guardian right now and take a break. Don't worry about studying until you feel better."

RESPONSE STYLE:
- Answer the question first, then optionally add one follow-up or example
- If a concept needs an example, give ONE short, concrete example
- Only ask a follow-up question if something is genuinely unclear
- Never ask multiple questions at once

WHAT TO AVOID:
❌ Asking the student to go review their material before you help
❌ Responding with a list of diagnostic questions
❌ Writing long explanations when a short one will do
❌ Saying "Great question!" or similar filler phrases
❌ Multi-paragraph responses

GOOD EXAMPLE:
Student: "I don't understand photosynthesis"
You: "Photosynthesis is how plants turn sunlight into food — they use sunlight, water, and carbon dioxide to make sugar and oxygen. Think of it as the plant's way of cooking its own meals using the sun as the stove."

BAD EXAMPLE:
Student: "I don't understand photosynthesis"
You: "That's a great question! Have you read through the lesson material on photosynthesis? What parts were confusing to you? Did you check your notes? Let's start by having you think about what you already know — what do you think happens when a plant gets sunlight?"`;

/**
 * Run Loopi using direct chat completions for better control
 */
async function runLoopi(messages: Array<{ role: string; content: string }>, context?: any) {
  // Build system message with optional context
  let systemMessage = LOOPI_SYSTEM_PROMPT;

  if (context) {
    systemMessage += `\n\nCURRENT CONTEXT:`;
    if (context.lessonTitle) systemMessage += `\nLesson: ${context.lessonTitle}`;
    if (context.lessonDescription) systemMessage += `\nDescription: ${context.lessonDescription}`;
    if (context.currentQuestion) systemMessage += `\nCurrent Question: ${context.currentQuestion}`;

    // Include struggle indicators if present
    if (context.recentAttempts !== undefined) {
      systemMessage += `\nRecent Attempts: ${context.recentAttempts}`;
    }
    if (context.lastScore !== undefined) {
      systemMessage += `\nLast Score: ${context.lastScore}%`;
    }
    if (context.isStruggling) {
      systemMessage += `\n⚠️ STUDENT IS STRUGGLING - Consider asking diagnostic questions to identify barriers`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 300, // Limit response length to enforce conciseness
  });

  const responseMessage = completion.choices[0]?.message?.content;

  if (!responseMessage) {
    throw new Error("No response generated");
  }

  return {
    message: responseMessage,
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
    const { messages, context } = body;

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

    // Run Loopi with full conversation history
    const { message } = await runLoopi(messages, context);

    return NextResponse.json({
      success: true,
      message,
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
