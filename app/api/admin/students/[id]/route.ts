import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// PATCH - Update student details (name, grade, parent, credentials)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: studentId } = await params;
    const body = await request.json();
    const { name, grade, parentId, email, password } = body;

    // Verify this student exists (single organization - all admins can manage all students)
    const student = await db.student.findFirst({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found or unauthorized" },
        { status: 404 }
      );
    }

    // If changing parent, verify new parent exists (single organization)
    if (parentId && parentId !== student.parentId) {
      const newParent = await db.user.findFirst({
        where: {
          id: parentId,
          role: "PARENT",
        },
      });

      if (!newParent) {
        return NextResponse.json(
          { error: "New parent not found" },
          { status: 404 }
        );
      }
    }

    // Handle user account creation/update
    let userId = student.userId;

    if (email) {
      if (userId) {
        // Update existing user account
        const updateData: any = { email };

        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }

        // Check if email is being changed to one that already exists
        const existingUser = await db.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          );
        }

        await db.user.update({
          where: { id: userId },
          data: updateData,
        });
      } else if (password) {
        // Create new user account
        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.user.create({
          data: {
            name: name || student.name,
            email,
            password: hashedPassword,
            role: "STUDENT",
            adminId: session.user.id,
          },
        });

        userId = user.id;
      }
    }

    // Update student profile
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        ...(name && { name }),
        ...(grade !== undefined && { grade: grade ? parseInt(grade) : null }),
        ...(parentId && { parentId }),
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: studentId } = await params;

    // Verify this student exists (single organization - all admins can manage all students)
    const student = await db.student.findFirst({
      where: {
        id: studentId,
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
