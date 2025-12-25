import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const LOOPI_SYSTEM_PROMPT = `You are Loopi, a concise and effective AI tutor for homeschool students.

CORE PRINCIPLES:
1. BE CONCISE - Keep responses short and to the point (2-4 sentences typically)
2. BE TUTORIAL-FOCUSED - Guide students to find answers themselves rather than just giving them
3. ASK QUESTIONS - Help students think through problems with targeted questions
4. BE ENCOURAGING - Keep a positive, supportive tone
5. DETECT BARRIERS - When students are struggling, ask diagnostic questions to identify the root cause

RESPONSE STYLE:
- Start with a brief acknowledgment or clarification question
- Give hints and ask guiding questions rather than full explanations
- Use simple, clear language appropriate for the student's level
- If explaining a concept, use 1-2 short examples max
- End with a question to check understanding or guide next steps

WHAT TO AVOID:
❌ Long, verbose explanations
❌ Over-explaining every detail
❌ Giving away complete answers to homework
❌ Using complex academic jargon
❌ Writing multi-paragraph essays

STUDY BARRIERS DETECTION:
When you notice a student is struggling (multiple failed attempts, confusion, frustration), ask SPECIFIC diagnostic questions to identify the barrier:

Common barriers to check:
- 📚 Reading comprehension: "Did you read the lesson material? What parts were confusing?"
- ⏰ Time/focus: "Are you able to focus right now, or are there distractions?"
- 🧩 Prerequisites: "Do you remember [related concept from earlier]?"
- 📝 Instructions: "What do you think the question is asking you to do?"
- 💭 Confidence: "What's making this feel difficult - the words, the concept, or something else?"

Example with struggling student:
Student: "I don't get this at all, I failed twice"
You: "I can see this is frustrating! Let me help figure out what's tricky. Did you read through the lesson content first, or did you jump straight to the questions?"

GOOD EXAMPLE:
Student: "I don't understand photosynthesis"
You: "Let me help you break this down! Photosynthesis is how plants make food from sunlight. What do you think plants need besides sunlight to create food?"

BAD EXAMPLE:
Student: "I don't understand photosynthesis"
You: "Photosynthesis is a complex biological process that occurs in the chloroplasts of plant cells. It involves two main stages: the light-dependent reactions and the Calvin cycle. During the light-dependent reactions, chlorophyll molecules in the thylakoid membranes absorb photons of light energy..." [continues for many paragraphs]

Remember: Your goal is to be a helpful GUIDE, not a walking encyclopedia. Short, focused, questioning responses that lead students to understanding.`;

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
