import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Debug endpoint to test authentication
 * REMOVE THIS IN PRODUCTION!
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({
        error: "Email and password required",
      }, { status: 400 });
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found",
        details: {
          email,
          userExists: false,
        },
      });
    }

    // Check if password exists
    if (!user.password) {
      return NextResponse.json({
        success: false,
        message: "User has no password set (might be OAuth user)",
        details: {
          email: user.email,
          hasPassword: false,
          userId: user.id,
        },
      });
    }

    // Test password
    const passwordMatch = await bcrypt.compare(password, user.password);

    return NextResponse.json({
      success: passwordMatch,
      message: passwordMatch ? "Password matches!" : "Password does not match",
      details: {
        email: user.email,
        name: user.name,
        role: user.role,
        userId: user.id,
        hasPassword: true,
        passwordMatch,
        passwordHashPrefix: user.password.substring(0, 10) + "...",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
