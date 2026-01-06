import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PARENT", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollmentId } = await params;

    // Check if enrollment exists and user has permission
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        },
        curriculum: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    // Only allow deletion if user is admin or the student's parent
    if (
      !["ADMIN", "SUPERADMIN"].includes(session.user.role) &&
      enrollment.student.parentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to unenroll this student" },
        { status: 403 }
      );
    }

    // Delete enrollment (cascade will handle related progress data)
    await db.enrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({
      success: true,
      message: `${enrollment.student.name} has been unenrolled from ${enrollment.curriculum.name}`,
    });
  } catch (error: any) {
    console.error("Error deleting enrollment:", error);

    return NextResponse.json(
      {
        error: "Failed to unenroll student",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
