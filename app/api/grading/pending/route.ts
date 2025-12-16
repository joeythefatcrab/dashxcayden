import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only parents and admins can grade
    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get students based on role
    let studentIds: string[] = [];

    if (session.user.role === "SUPERADMIN") {
      // Superadmin sees all students
      const allStudents = await db.student.findMany({
        select: { id: true },
      });
      studentIds = allStudents.map((s) => s.id);
    } else if (session.user.role === "PARENT") {
      // Parents see their own students
      const students = await db.student.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    } else if (session.user.role === "ADMIN") {
      // Admins see students of parents under them
      const parents = await db.user.findMany({
        where: { adminId: session.user.id },
        select: { id: true },
      });
      const parentIds = parents.map((p) => p.id);

      const students = await db.student.findMany({
        where: { parentId: { in: parentIds } },
        select: { id: true },
      });
      studentIds = students.map((s) => s.id);
    }

    // Find all attempts with items needing grading
    const attempts = await db.attempt.findMany({
      where: {
        studentId: { in: studentIds },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            unit: {
              select: {
                title: true,
                curriculum: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter attempts that have items needing grading
    const pendingGrades = attempts
      .map((attempt) => {
        const detail = attempt.detail as any;
        const needsGrading = Object.entries(detail).filter(
          ([_, itemDetail]: [string, any]) => itemDetail.needsGrading === true
        );

        if (needsGrading.length === 0) return null;

        return {
          attemptId: attempt.id,
          studentId: attempt.student.id,
          studentName: attempt.student.name,
          lessonId: attempt.lesson.id,
          lessonTitle: attempt.lesson.title,
          unitTitle: attempt.lesson.unit.title,
          curriculumId: attempt.lesson.unit.curriculum.id,
          curriculumName: attempt.lesson.unit.curriculum.name,
          submittedAt: attempt.createdAt,
          itemsNeedingGrading: needsGrading.map(([itemId, itemDetail]: [string, any]) => ({
            itemId,
            answer: itemDetail.answer,
            itemType: itemDetail.itemType,
            itemPrompt: itemDetail.itemPrompt,
            maxPoints: itemDetail.maxPoints,
          })),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      pendingGrades,
      count: pendingGrades.length,
    });
  } catch (error) {
    console.error("Error fetching pending grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending grades" },
      { status: 500 }
    );
  }
}
