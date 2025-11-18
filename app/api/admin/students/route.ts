import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Create a new student for a parent
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, grade } = body;

    // Validate input
    if (!name || !parentId) {
      return NextResponse.json(
        { error: "Student name and parent ID are required" },
        { status: 400 }
      );
    }

    // Verify parent belongs to this admin
    const parent = await db.user.findFirst({
      where: {
        id: parentId,
        role: "PARENT",
        adminId: session.user.id,
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create student
    const student = await db.student.create({
      data: {
        name,
        parentId,
        grade: grade ? parseInt(grade) : null,
      },
    });

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
