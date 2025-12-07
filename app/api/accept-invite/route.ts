import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, code, name, password } = await request.json();

    if (!email || !code || !name || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Find user with matching email and invite code (stored as temporary password)
    const user = await db.user.findFirst({
      where: {
        email,
        password: code, // The code was stored as temporary password
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid invite link or code" },
        { status: 400 }
      );
    }

    // Check if user already completed setup (name is not "Pending")
    if (user.name !== "Pending") {
      return NextResponse.json(
        { error: "This invite has already been used" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with real name and password
    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
