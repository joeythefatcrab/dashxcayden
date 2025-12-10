import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, grade, curriculaIds } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account for the student
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "STUDENT",
        emailVerified: new Date(), // Auto-verify
      },
    });

    // Create student profile
    const student = await db.student.create({
      data: {
        name,
        userId: user.id,
        parentId: session.user.id,
        grade: grade || null,
      },
    });

    // Enroll in selected curricula
    if (curriculaIds && curriculaIds.length > 0) {
      await db.enrollment.createMany({
        data: curriculaIds.map((curriculumId: string) => ({
          studentId: student.id,
          curriculumId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student account" },
      { status: 500 }
    );
  }
}
