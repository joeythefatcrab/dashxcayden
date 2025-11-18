import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password, name } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await db.studentInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      await db.studentInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 409 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: invitation.studentEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student user and profile in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: invitation.studentEmail,
          password: hashedPassword,
          name: name || invitation.studentName || invitation.studentEmail.split("@")[0],
          role: "STUDENT",
          emailVerified: new Date(), // Auto-verify
        },
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          name: user.name!,
          userId: user.id,
          parentId: invitation.parentId,
        },
      });

      // Enroll in curricula if specified
      if (invitation.curriculaIds.length > 0) {
        await tx.enrollment.createMany({
          data: invitation.curriculaIds.map((curriculumId) => ({
            studentId: student.id,
            curriculumId,
          })),
        });
      }

      // Mark invitation as accepted
      await tx.studentInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      return { user, student };
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully! You can now sign in.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

// Get invitation details (for displaying on accept page)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await db.studentInvitation.findUnique({
      where: { token },
      select: {
        studentEmail: true,
        studentName: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        curriculaIds: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = invitation.expiresAt < new Date();

    return NextResponse.json({
      invitation: {
        ...invitation,
        isExpired,
      },
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}
