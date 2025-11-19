import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateAssignment } from "@/lib/ai/openai-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic, gradeLevel, difficulty, numQuestions, questionTypes } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Call OpenAI to generate assignment
    const questions = await generateAssignment({
      topic,
      gradeLevel,
      difficulty,
      numQuestions,
      questionTypes,
    });

    return NextResponse.json({
      success: true,
      questions,
      message: `Generated ${questions.length} questions successfully`,
    });
  } catch (error) {
    console.error("Error generating assignment:", error);
    return NextResponse.json(
      {
        error: "Failed to generate assignment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
