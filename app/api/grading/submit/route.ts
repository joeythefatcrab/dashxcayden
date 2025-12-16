import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only parents and admins can grade
    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { attemptId, grades } = body;
    // grades format: { itemId: { points: number, feedback?: string } }

    // Get the attempt
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: {
        lesson: {
          include: {
            items: true,
            unit: {
              include: {
                curriculum: true,
                lessons: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        student: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Verify access (parent owns student, admin owns parent, or superadmin)
    if (session.user.role === "PARENT") {
      const student = await db.student.findUnique({
        where: { id: attempt.studentId },
      });
      if (student?.parentId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "ADMIN") {
      const student = await db.student.findUnique({
        where: { id: attempt.studentId },
        include: {
          parent: true,
        },
      });
      if (student?.parent.adminId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update the attempt detail with grades
    const detail = attempt.detail as any;
    let earnedPoints = 0;
    let totalPoints = 0;

    // Recalculate all points
    for (const item of attempt.lesson.items) {
      totalPoints += item.points;

      if (grades[item.id]) {
        // Manual grade provided
        const grade = grades[item.id];
        detail[item.id] = {
          ...detail[item.id],
          points: grade.points,
          correct: grade.points > 0,
          needsGrading: false,
          gradedBy: session.user.id,
          gradedAt: new Date().toISOString(),
          feedback: grade.feedback || undefined,
        };
        earnedPoints += grade.points;
      } else if (detail[item.id]) {
        // Already graded (auto-graded items)
        earnedPoints += detail[item.id].points || 0;
      }
    }

    // Calculate new score
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Update attempt
    await db.attempt.update({
      where: { id: attemptId },
      data: {
        detail,
        score,
        earned: earnedPoints,
        maxScore: totalPoints,
      },
    });

    // Update enrollment progress if score meets threshold
    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId: attempt.studentId,
          curriculumId: attempt.lesson.unit.curriculum.id,
        },
      },
    });

    if (enrollment) {
      const progress = (enrollment.progress as any) || {};
      const currentProgress = progress[attempt.lessonId] || {};

      // Update this lesson's progress
      progress[attempt.lessonId] = {
        ...currentProgress,
        unlocked: true,
        bestScore: Math.max(currentProgress.bestScore || 0, score),
        lastAttempt: new Date().toISOString(),
        completed: score >= attempt.lesson.threshold,
      };

      // Unlock next lesson if threshold met
      if (score >= attempt.lesson.threshold) {
        const currentIndex = attempt.lesson.unit.lessons.findIndex(
          (l) => l.id === attempt.lessonId
        );
        const nextLesson = attempt.lesson.unit.lessons[currentIndex + 1];

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
            studentId: attempt.studentId,
            curriculumId: attempt.lesson.unit.curriculum.id,
          },
        },
        data: { progress },
      });
    }

    return NextResponse.json({
      success: true,
      score,
      earnedPoints,
      totalPoints,
      passed: score >= attempt.lesson.threshold,
    });
  } catch (error) {
    console.error("Error submitting grade:", error);
    return NextResponse.json(
      { error: "Failed to submit grade" },
      { status: 500 }
    );
  }
}
