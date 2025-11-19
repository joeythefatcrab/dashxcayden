import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Assign curriculum to students
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { curriculumId, studentIds } = body;

    if (!curriculumId || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: "Curriculum ID and student IDs are required" },
        { status: 400 }
      );
    }

    // Verify curriculum belongs to user (or is public)
    const curriculum = await db.curriculum.findFirst({
      where: {
        id: curriculumId,
        OR: [
          { createdById: session.user.id },
          { isPublic: true },
        ],
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: "Curriculum not found or unauthorized" },
        { status: 404 }
      );
    }

    // For parents: verify they own these students
    // For admins: verify students belong to their parents
    const students = await db.student.findMany({
      where: {
        id: { in: studentIds },
        ...(session.user.role === "PARENT"
          ? { parentId: session.user.id }
          : {
              parent: {
                adminId: session.user.id,
              },
            }),
      },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students not found or unauthorized" },
        { status: 403 }
      );
    }

    // Create enrollments (use upsert to avoid duplicates)
    const enrollments = await Promise.all(
      studentIds.map((studentId) =>
        db.enrollment.upsert({
          where: {
            studentId_curriculumId: {
              studentId,
              curriculumId,
            },
          },
          create: {
            studentId,
            curriculumId,
            progress: {},
          },
          update: {
            // If already exists, just update timestamp
            updatedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Curriculum assigned to ${enrollments.length} student(s)`,
      enrollments: enrollments.length,
    });
  } catch (error) {
    console.error("Error assigning curriculum:", error);
    return NextResponse.json(
      { error: "Failed to assign curriculum" },
      { status: 500 }
    );
  }
}

// DELETE - Unassign curriculum from student
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const curriculumId = searchParams.get("curriculumId");

    if (!studentId || !curriculumId) {
      return NextResponse.json(
        { error: "Student ID and curriculum ID are required" },
        { status: 400 }
      );
    }

    // Verify student belongs to user
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        ...(session.user.role === "PARENT"
          ? { parentId: session.user.id }
          : {
              parent: {
                adminId: session.user.id,
              },
            }),
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete enrollment
    await db.enrollment.delete({
      where: {
        studentId_curriculumId: {
          studentId,
          curriculumId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Curriculum unassigned successfully",
    });
  } catch (error) {
    console.error("Error unassigning curriculum:", error);
    return NextResponse.json(
      { error: "Failed to unassign curriculum" },
      { status: 500 }
    );
  }
}
