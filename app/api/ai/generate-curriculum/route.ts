import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateCurriculumFromWireframe } from "@/lib/ai/openai-service";
import { generateCourseCode } from "@/lib/utils/course-code";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, subject, gradeLevel, outline, imageUrl, saveToDatabase } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Call OpenAI to generate curriculum
    const generatedCurriculum = await generateCurriculumFromWireframe({
      title,
      description,
      subject,
      gradeLevel,
      outline,
      imageUrl,
    });

    // If saveToDatabase is true, save to database
    if (saveToDatabase) {
      // Generate unique course code
      let courseCode: string;
      let isUnique = false;
      while (!isUnique) {
        courseCode = generateCourseCode();
        const existing = await db.curriculum.findUnique({
          where: { courseCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      // Save curriculum to database
      const curriculum = await db.curriculum.create({
        data: {
          name: generatedCurriculum.name,
          description: generatedCurriculum.description,
          subject: generatedCurriculum.subject,
          grade: generatedCurriculum.grade,
          courseCode: courseCode!,
          isPublic: true,
          createdById: session.user.id,
          rawData: generatedCurriculum as any,
          units: {
            create: generatedCurriculum.units.map((unit) => ({
              title: unit.title,
              description: unit.description,
              order: unit.order,
              lessons: {
                create: unit.lessons.map((lesson) => ({
                  title: lesson.title,
                  description: lesson.description,
                  contentMd: lesson.contentMd,
                  order: lesson.order,
                  threshold: lesson.threshold,
                  objectives: lesson.objectives,
                  items: {
                    create: lesson.items.map((item) => ({
                      type: item.type,
                      prompt: item.prompt,
                      order: item.order,
                      choices: item.choices ?? undefined,
                      answerKey: item.answerKey,
                      points: item.points,
                    })),
                  },
                })),
              },
            })),
          },
        },
      });

      return NextResponse.json({
        success: true,
        curriculum: generatedCurriculum,
        curriculumId: curriculum.id,
        courseCode: curriculum.courseCode,
        message: "Curriculum generated and saved successfully",
      });
    }

    // Otherwise just return the generated curriculum
    return NextResponse.json({
      success: true,
      curriculum: generatedCurriculum,
      message: "Curriculum generated successfully",
    });
  } catch (error) {
    console.error("Error generating curriculum:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isOpenAIError = errorMessage.includes("OpenAI") || errorMessage.includes("API key");

    return NextResponse.json(
      {
        error: "Failed to generate curriculum",
        details: errorMessage,
        suggestion: isOpenAIError
          ? "Please make sure OPENAI_API_KEY is set in your environment variables"
          : "Check server logs for more details",
      },
      { status: 500 }
    );
  }
}
