import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only ADMIN and SUPERADMIN can assign students
    // @ts-ignore
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { studentId, parentId } = await req.json();

    if (!studentId || !parentId) {
      return NextResponse.json(
        { error: "studentId and parentId are required" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify parent exists and has PARENT role
    const parent = await db.user.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.role !== "PARENT") {
      return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
    }

    // Update student's parent
    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: { parentId },
    });

    return NextResponse.json({
      success: true,
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error assigning student to parent:", error);
    return NextResponse.json(
      { error: "Failed to assign student" },
      { status: 500 }
    );
  }
}
