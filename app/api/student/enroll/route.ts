import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, curriculumId } = await req.json();

    if (!studentId || !curriculumId) {
      return NextResponse.json(
        { error: "Student ID and Curriculum ID are required" },
        { status: 400 }
      );
    }

    // Verify student exists and user has access
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // @ts-ignore
    const userRole = session.user.role;

    // Check authorization: student themselves, their parent, or teacher/admin
    const isAuthorized =
      student.userId === session.user.id ||
      student.parentId === session.user.id ||
      userRole === "TEACHER" ||
      userRole === "ADMIN";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Not authorized to enroll this student" },
        { status: 403 }
      );
    }

    // Verify curriculum exists
    const curriculum = await db.curriculum.findUnique({
      where: { id: curriculumId },
      include: {
        units: {
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: "Curriculum not found" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId,
          curriculumId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already enrolled in this curriculum" },
        { status: 409 }
      );
    }

    // Initialize progress for first lesson (unlock it)
    const firstLesson = curriculum.units[0]?.lessons[0];
    const initialProgress = firstLesson
      ? {
          [firstLesson.id]: {
            unlocked: true,
            bestScore: 0,
            completed: false,
          },
        }
      : {};

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        studentId,
        curriculumId,
        progress: initialProgress,
      },
    });

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        curriculumId: enrollment.curriculumId,
      },
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      {
        error: "Failed to enroll in course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
