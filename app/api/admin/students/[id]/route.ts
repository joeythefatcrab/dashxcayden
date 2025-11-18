import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE - Delete a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = params.id;

    // Verify this student belongs to a parent managed by this admin
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        parent: {
          adminId: session.user.id,
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete student (enrollments will be cascade deleted)
    await db.student.delete({
      where: { id: studentId },
    });

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
