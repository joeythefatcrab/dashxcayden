import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, grade, feedback } = body;

    if (!submissionId || grade === undefined) {
      return NextResponse.json(
        { error: "submissionId and grade are required" },
        { status: 400 }
      );
    }

    // Validate grade
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      return NextResponse.json(
        { error: "Grade must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Get submission and verify parent owns the student
    const submission = await db.essaySubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            parentId: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (
      session.user.role === "PARENT" &&
      submission.student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure it's submitted
    if (submission.status !== "SUBMITTED" && submission.status !== "GRADED") {
      return NextResponse.json(
        { error: "Can only grade submitted essays" },
        { status: 400 }
      );
    }

    // Update with grade
    const graded = await db.essaySubmission.update({
      where: { id: submissionId },
      data: {
        status: "GRADED",
        grade: gradeNum,
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedBy: session.user.id,
      },
    });

    // Propagate essay grade back into the lesson attempt and enrollment progress
    try {
      const item = await db.item.findUnique({
        where: { id: submission.itemId },
        select: { points: true },
      });

      if (item) {
        const essayEarnedPoints = Math.round((gradeNum / 100) * item.points);

        // Find the most recent attempt for this student + lesson
        const latestAttempt = await db.attempt.findFirst({
          where: {
            studentId: submission.studentId,
            lessonId: submission.lessonId,
          },
          orderBy: { createdAt: "desc" },
        });

        if (latestAttempt) {
          const detail = latestAttempt.detail as Record<string, any>;

          // Get previous points for this item (if AI already graded)
          const previousPoints = detail[submission.itemId]?.points || 0;

          // Credit the essay item in the attempt detail
          detail[submission.itemId] = {
            ...detail[submission.itemId],
            correct: gradeNum >= 60,
            points: essayEarnedPoints,
            needsGrading: false,
            graded: true,
            aiGraded: false, // Clear AI grade flag since parent graded
          };

          // Replace, not add, the points (in case AI already scored this)
          const newEarned = latestAttempt.earned - previousPoints + essayEarnedPoints;
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

          // Update enrollment progress if threshold is now met
          const lesson = await db.lesson.findUnique({
            where: { id: submission.lessonId },
            include: {
              unit: {
                include: {
                  lessons: { orderBy: { order: "asc" } },
                },
              },
            },
          });

          if (lesson) {
            const enrollment = await db.enrollment.findUnique({
              where: {
                studentId_curriculumId: {
                  studentId: submission.studentId,
                  curriculumId: lesson.unit.curriculumId,
                },
              },
            });

            if (enrollment) {
              const progress = (enrollment.progress as any) || {};

              progress[submission.lessonId] = {
                ...progress[submission.lessonId],
                bestScore: Math.max(
                  progress[submission.lessonId]?.bestScore || 0,
                  newScore
                ),
                completed: newScore >= lesson.threshold,
              };

              // Unlock next lesson if threshold met
              if (newScore >= lesson.threshold) {
                const currentIndex = lesson.unit.lessons.findIndex(
                  (l) => l.id === submission.lessonId
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
      // Don't fail the grading response if progress update fails
      console.error("Failed to propagate essay grade to lesson progress:", propagationError);
    }

    return NextResponse.json(graded);
  } catch (error) {
    console.error("Error grading essay:", error);
    return NextResponse.json(
      { error: "Failed to grade essay" },
      { status: 500 }
    );
  }
}
