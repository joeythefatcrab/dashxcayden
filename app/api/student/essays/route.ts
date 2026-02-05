import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { logActivity } from "@/lib/activity-logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Essay Grading Assistant ID
const ESSAY_GRADING_ASSISTANT_ID = process.env.ESSAY_GRADING_ASSISTANT_ID || "asst_REPLACE_ME";

// AI Grading Function
async function gradeEssayWithAI(prompt: string, essayContent: string, gradeLevel: number) {
  try {
    // Create a thread with the grading request
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            prompt: prompt,
            essay: essayContent,
            gradeLevel: gradeLevel,
          }),
        },
      ],
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: ESSAY_GRADING_ASSISTANT_ID,
    });

    if (run.status !== "completed") {
      console.error("Assistant run failed:", run.status);
      return null;
    }

    // Get the response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find((m) => m.role === "assistant");

    if (!assistantMessage) {
      console.error("No assistant response found");
      return null;
    }

    // Parse the JSON response
    const content = assistantMessage.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text.value)
      .join("");

    console.log("Raw assistant response:", content.substring(0, 200));

    // Try to extract JSON from the response
    let jsonContent = content;

    // Try to find JSON in markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      // Try to find JSON object directly
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonContent = objectMatch[0];
      }
    }

    const result = JSON.parse(jsonContent);
    return result;
  } catch (error) {
    console.error("Error grading essay with AI:", error);
    return null;
  }
}

// GET - Fetch essay submission
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const itemId = searchParams.get("itemId");

    if (!studentId || !itemId) {
      return NextResponse.json(
        { error: "studentId and itemId are required" },
        { status: 400 }
      );
    }

    // Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find submission
    const submission = await db.essaySubmission.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching essay submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// POST - Create or update essay submission
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, lessonId, itemId, content, status, prompt } = body;

    if (!studentId || !lessonId || !itemId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if submission already exists
    const existing = await db.essaySubmission.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    // Don't allow editing after submission (except for revisions)
    if (existing && existing.status !== "DRAFT" && existing.status !== "REVISION_REQUESTED") {
      return NextResponse.json(
        { error: "Cannot edit submitted essay" },
        { status: 400 }
      );
    }

    // If submitting (not just saving draft), trigger AI grading
    let aiGradeData = {};
    const isResubmission = existing && existing.status === "REVISION_REQUESTED";
    if (status === "SUBMITTED" && (!existing || isResubmission)) {
      try {
        // Get essay prompt - first try from Item table, fallback to passed prompt
        let essayPrompt = prompt || "Write an essay about this topic";

        const item = await db.item.findUnique({
          where: { id: itemId },
          select: { prompt: true },
        });

        if (item?.prompt) {
          essayPrompt = item.prompt;
        }

        const studentData = await db.student.findUnique({
          where: { id: studentId },
          select: { grade: true },
        });

        if (studentData) {
          console.log("Starting AI grading for essay...");
          const gradeResult = await gradeEssayWithAI(
            essayPrompt,
            content,
            studentData.grade || 8 // Default to 8th grade if not set
          );

          if (gradeResult) {
            console.log("AI grading successful:", gradeResult.grade);
            aiGradeData = {
              aiGrade: gradeResult.grade,
              aiStrengths: JSON.stringify(gradeResult.strengths),
              aiImprovements: JSON.stringify(gradeResult.improvements),
              aiSummary: gradeResult.summary,
              aiParentNote: gradeResult.parentNote,
              aiGradedAt: new Date(),
            };
          } else {
            console.log("AI grading returned null");
          }
        }
      } catch (error) {
        console.error("AI grading failed:", error);
        // Continue without AI grading if it fails
      }
    }

    // Create or update submission
    const submission = await db.essaySubmission.upsert({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
      update: {
        content,
        status: status || "DRAFT",
        submittedAt: status === "SUBMITTED" ? new Date() : existing?.submittedAt,
        ...aiGradeData,
      },
      create: {
        studentId,
        lessonId,
        itemId,
        content,
        status: status || "DRAFT",
        submittedAt: status === "SUBMITTED" ? new Date() : null,
        ...aiGradeData,
      },
    });

    // Log activity for essay submission
    if (status === "SUBMITTED" && (!existing || existing.status === "DRAFT" || existing.status === "REVISION_REQUESTED")) {
      await logActivity({
        userId: session.user.id,
        userRole: "STUDENT",
        type: "ESSAY_SUBMIT",
        description: `Submitted essay for lesson ${lessonId}`,
        metadata: {
          studentId,
          lessonId,
          itemId,
          submissionId: submission.id,
        },
      });

      // Propagate AI grade to lesson attempt so student can progress while waiting for parent review
      if (aiGradeData && (aiGradeData as any).aiGrade !== undefined) {
        try {
          const item = await db.item.findUnique({
            where: { id: itemId },
            select: { points: true },
          });

          if (item) {
            const aiGrade = (aiGradeData as any).aiGrade;
            const essayEarnedPoints = Math.round((aiGrade / 100) * item.points);

            // Find or create attempt for this lesson
            let latestAttempt = await db.attempt.findFirst({
              where: {
                studentId: studentId,
                lessonId: lessonId,
              },
              orderBy: { createdAt: "desc" },
            });

            if (latestAttempt) {
              const detail = latestAttempt.detail as Record<string, any>;

              // Credit the essay item
              detail[itemId] = {
                ...detail[itemId],
                correct: aiGrade >= 60,
                points: essayEarnedPoints,
                needsGrading: false,
                aiGraded: true,
              };

              const newEarned = latestAttempt.earned + essayEarnedPoints;
              const newScore =
                latestAttempt.maxScore > 0
                  ? Math.round((newEarned / latestAttempt.maxScore) * 100)
                  : 0;

              await db.attempt.update({
                where: { id: latestAttempt.id },
                data: {
                  score: newScore,
                  earned: newEarned,
                  detail,
                },
              });

              // Update enrollment progress
              const lesson = await db.lesson.findUnique({
                where: { id: lessonId },
                include: {
                  unit: {
                    include: {
                      curriculum: { select: { id: true } },
                      lessons: { orderBy: { order: "asc" } },
                    },
                  },
                },
              });

              if (lesson) {
                const enrollment = await db.enrollment.findUnique({
                  where: {
                    studentId_curriculumId: {
                      studentId: studentId,
                      curriculumId: lesson.unit.curriculum.id,
                    },
                  },
                });

                if (enrollment) {
                  const progress = (enrollment.progress as any) || {};

                  progress[lessonId] = {
                    ...progress[lessonId],
                    bestScore: Math.max(
                      progress[lessonId]?.bestScore || 0,
                      newScore
                    ),
                    completed: newScore >= lesson.threshold,
                  };

                  // Unlock next lesson if threshold met
                  if (newScore >= lesson.threshold) {
                    const currentIndex = lesson.unit.lessons.findIndex(
                      (l) => l.id === lessonId
                    );
                    const nextLesson = lesson.unit.lessons[currentIndex + 1];
                    if (nextLesson) {
                      progress[nextLesson.id] = {
                        ...(progress[nextLesson.id] || {}),
                        unlocked: true,
                      };
                    }
                  }

                  await db.enrollment.update({
                    where: { id: enrollment.id },
                    data: { progress },
                  });
                }
              }
            }
          }
        } catch (propagationError) {
          console.error("Failed to propagate AI grade to lesson progress:", propagationError);
        }
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error saving essay submission:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
