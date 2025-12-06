import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build system prompt for educational assistant
    const systemPrompt = `You are a friendly and helpful AI tutor for homeschool students. Your role is to:

1. Help students understand their coursework and assignments
2. Explain concepts in simple, age-appropriate language
3. Ask guiding questions to help students think critically
4. Encourage students and celebrate their progress
5. Never give direct answers to homework - instead guide them to discover the answer
6. Use examples and analogies to make complex topics easier to understand

Be supportive, patient, and encouraging. If a student is struggling, break down the problem into smaller steps.

${context?.lessonTitle ? `The student is currently working on: ${context.lessonTitle}` : ""}
${context?.lessonDescription ? `Lesson description: ${context.lessonDescription}` : ""}
${context?.currentQuestion ? `Current question they're working on: ${context.currentQuestion}` : ""}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0].message.content;

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      usage: response.usage,
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
