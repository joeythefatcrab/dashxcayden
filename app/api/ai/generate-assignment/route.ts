import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAssignment } from "@/lib/ai/openai-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      lessonId,
      lessonTitle,
      lessonDescription,
      questionCount,
      instructions,
      questionTypes,
    } = body;

    if (!lessonId || !lessonTitle) {
      return NextResponse.json(
        { error: "Lesson ID and title are required" },
        { status: 400 }
      );
    }

    // Fetch the lesson to verify it exists and get context
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        items: true,
        unit: {
          include: {
            curriculum: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Build the topic description for AI
    const topic = `${lessonTitle}${
      lessonDescription ? `: ${lessonDescription}` : ""
    }${instructions ? `\n\nAdditional instructions: ${instructions}` : ""}`;

    // Parse question types from comma-separated string
    const types = questionTypes
      ?.split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);

    // Call OpenAI to generate assignment
    const questions = await generateAssignment({
      topic,
      gradeLevel: lesson.unit.curriculum.grade ?? undefined,
      numQuestions: questionCount || 5,
      questionTypes: types,
    });

    // Get the current max order for items in this lesson
    const maxOrder =
      lesson.items.length > 0
        ? Math.max(...lesson.items.map((item) => item.order))
        : -1;

    // Save questions to the database
    const createdItems = await Promise.all(
      questions.map(async (question, index) => {
        return db.item.create({
          data: {
            lessonId: lesson.id,
            type: question.type || "SHORT_ANSWER",
            prompt: question.prompt,
            order: maxOrder + index + 1,
            choices: question.choices ?? undefined,
            answerKey: question.answerKey,
            points: question.points || 1,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      questions: createdItems,
      message: `Generated and saved ${createdItems.length} questions successfully`,
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
