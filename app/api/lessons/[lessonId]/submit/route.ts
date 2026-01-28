import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { markAttendance } from "@/lib/attendance";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, curriculumId, answers } = body;

    // Verify student access
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId,
          curriculumId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    // Get lesson with items
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        items: {
          orderBy: { order: "asc" },
        },
        unit: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Grade each item
    const detail: Record<string, any> = {};
    let totalPoints = 0;
    let earnedPoints = 0;
    let needsManualGrading = false;

    for (const item of lesson.items) {
      const studentAnswer = answers[item.id];
      const answerKey = item.answerKey as any;
      let correct = false;
      let points = 0;

      totalPoints += item.points;

      if (item.type === "MCQ" || item.type === "TRUE_FALSE") {
        // Check if answer matches correct indices
        const correctIndices = answerKey.correct || [];
        if (correctIndices.includes(studentAnswer)) {
          correct = true;
          points = item.points;
        }
      } else if (item.type === "ESSAY" || item.type === "SHORT_ANSWER") {
        // These require manual grading - mark as pending
        needsManualGrading = true;
        detail[item.id] = {
          answer: studentAnswer,
          correct: false,
          points: 0,
          needsGrading: true,
          itemType: item.type,
          itemPrompt: item.prompt,
          maxPoints: item.points,
        };
        continue; // Skip adding to earnedPoints for now
      } else if (item.type === "CHECKBOX") {
        // Check if student opted out (for optional items)
        if (studentAnswer === "OPTED_OUT" && item.isOptional) {
          detail[item.id] = {
            answer: "OPTED_OUT",
            correct: false,
            points: 0,
            optedOut: true,
          };
          // Don't count opted-out items in total points
          totalPoints -= item.points;
          continue;
        }

        // Honor system - if checked, award points
        if (studentAnswer === true) {
          correct = true;
          points = item.points;
        }
      }

      earnedPoints += points;
      detail[item.id] = {
        answer: studentAnswer,
        correct,
        points,
      };
    }

    // Calculate percentage
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Save attempt
    const attempt = await db.attempt.create({
      data: {
        studentId,
        lessonId,
        score,
        maxScore: totalPoints,
        earned: earnedPoints,
        detail,
      },
    });

    // Update enrollment progress
    const progress = (enrollment.progress as any) || {};
    const currentProgress = progress[lessonId] || {};

    // Update this lesson's progress
    progress[lessonId] = {
      ...currentProgress,
      unlocked: true,
      bestScore: Math.max(currentProgress.bestScore || 0, score),
      lastAttempt: new Date().toISOString(),
      completed: score >= lesson.threshold,
    };

    // Unlock next lesson if threshold met
    if (score >= lesson.threshold) {
      const currentIndex = lesson.unit.lessons.findIndex((l) => l.id === lessonId);
      const nextLesson = lesson.unit.lessons[currentIndex + 1];

      if (nextLesson) {
        progress[nextLesson.id] = {
          ...(progress[nextLesson.id] || {}),
          unlocked: true,
        };
      }
    }

    await db.enrollment.update({
      where: {
        studentId_curriculumId: {
          studentId,
          curriculumId,
        },
      },
      data: { progress },
    });

    // Log activity
    await db.activity.create({
      data: {
        studentId,
        type: score >= lesson.threshold ? "lesson_completed" : "lesson_attempted",
        lessonId,
        metadata: {
          score,
          threshold: lesson.threshold,
          passed: score >= lesson.threshold,
        },
      },
    });

    // Auto-mark attendance for today
    await markAttendance(studentId);

    // Log lesson completion activity
    await logActivity({
      userId: session.user.id,
      userRole: "STUDENT",
      type: "LESSON_COMPLETE",
      description: `Completed lesson: ${lesson.title}`,
      metadata: {
        studentId,
        lessonId,
        curriculumId,
        score,
        earned: earnedPoints,
        maxScore: totalPoints,
        passed: score >= lesson.threshold,
        needsManualGrading,
      },
    });

    // Log short answer submissions if any
    if (needsManualGrading) {
      await logActivity({
        userId: session.user.id,
        userRole: "STUDENT",
        type: "SHORT_ANSWER_SUBMIT",
        description: `Submitted short answer questions for ${lesson.title}`,
        metadata: {
          studentId,
          lessonId,
          attemptId: attempt.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      score,
      earned: earnedPoints,
      maxScore: totalPoints,
      detail,
      passed: score >= lesson.threshold,
      needsManualGrading,
      pendingReview: needsManualGrading,
    });
  } catch (error) {
    console.error("Grading error:", error);
    return NextResponse.json(
      { error: "Failed to grade submission" },
      { status: 500 }
    );
  }
}
