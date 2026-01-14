import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Get the signup code from system settings
    const setting = await db.systemSetting.findUnique({
      where: { key: "signup_code" },
    });

    // If no code is set, allow signups (for initial setup)
    if (!setting) {
      // Set a valid cookie to allow signup
      const cookieStore = await cookies();
      cookieStore.set("signup_code_validated", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10, // 10 minutes
      });
      return NextResponse.json({ success: true });
    }

    // Validate the code
    if (code !== setting.value) {
      return NextResponse.json(
        { error: "Invalid signup code" },
        { status: 403 }
      );
    }

    // Set a valid cookie to allow signup
    const cookieStore = await cookies();
    cookieStore.set("signup_code_validated", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup code validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate code" },
      { status: 500 }
    );
  }
}
