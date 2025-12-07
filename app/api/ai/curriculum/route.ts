import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCurriculumChecksheet } from "@/lib/ai/openai-service";

/**
 * POST /api/ai/curriculum
 *
 * Generate a study-tech style curriculum checksheet using Loopi Curriculum Planner.
 * This is for parents/teachers/admins, not students.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only allow parents and admins to generate curricula
    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "AI curriculum generation is not configured",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt, studentAge, subject, durationWeeks } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Prompt is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    // Generate the curriculum checksheet
    const checksheet = await generateCurriculumChecksheet({
      prompt: prompt.trim(),
      studentAge,
      subject,
      durationWeeks,
    });

    return NextResponse.json({
      success: true,
      checksheet,
    });
  } catch (error) {
    console.error("Error in curriculum generation API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong generating the curriculum.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
