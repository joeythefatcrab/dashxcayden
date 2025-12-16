import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST - Create a new student for a parent (with optional user account)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, grade, email, password } = body;

    // Validate input
    if (!name || !parentId) {
      return NextResponse.json(
        { error: "Student name and parent ID are required" },
        { status: 400 }
      );
    }

    // Verify parent exists (single organization - all admins can manage all parents)
    const parent = await db.user.findFirst({
      where: {
        id: parentId,
        role: "PARENT",
      },
    });

    if (!parent) {
      return NextResponse.json(
        { error: "Parent not found" },
        { status: 404 }
      );
    }

    let userId = null;

    // If email and password provided, create a user account for the student
    if (email && password) {
      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
      const user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          adminId: session.user.id,
        },
      });

      userId = user.id;
    }

    // Create student profile
    const student = await db.student.create({
      data: {
        name,
        parentId,
        userId,
        grade: grade ? parseInt(grade) : null,
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
