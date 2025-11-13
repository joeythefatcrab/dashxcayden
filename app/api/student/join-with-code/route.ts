import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidCourseCode, formatCourseCode } from "@/lib/utils/course-code";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, courseCode } = await req.json();

    if (!studentId || !courseCode) {
      return NextResponse.json(
        { error: "Student ID and course code are required" },
        { status: 400 }
      );
    }

    // Format and validate code
    const formattedCode = formatCourseCode(courseCode);

    if (!isValidCourseCode(formattedCode)) {
      return NextResponse.json(
        { error: "Invalid course code format. Expected format: ABC-123" },
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

    // Check authorization
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

    // Find curriculum by course code
    const curriculum = await db.curriculum.findUnique({
      where: { courseCode: formattedCode },
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
        { error: "Course not found. Please check the code and try again." },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId,
          curriculumId: curriculum.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already enrolled in this course" },
        { status: 409 }
      );
    }

    // Initialize progress for first lesson
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
        curriculumId: curriculum.id,
        progress: initialProgress,
      },
    });

    // Log activity
    await db.activity.create({
      data: {
        studentId,
        type: "course_enrolled",
        metadata: {
          curriculumId: curriculum.id,
          curriculumName: curriculum.name,
          enrolledVia: "course_code",
        },
      },
    });

    return NextResponse.json({
      success: true,
      curriculumId: curriculum.id,
      curriculumName: curriculum.name,
    });
  } catch (error) {
    console.error("Join with code error:", error);
    return NextResponse.json(
      {
        error: "Failed to join course",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
