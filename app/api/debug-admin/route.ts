import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER FIXING
export async function GET() {
  try {
    // Check if admin exists
    const admin = await db.user.findUnique({
      where: { email: "admin@homeschool.com" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
      },
    });

    if (!admin) {
      return NextResponse.json({
        error: "Admin user not found in database",
        suggestion: "The SQL may not have run successfully. Check your database console for errors.",
      });
    }

    // Test if password hash works
    const testPassword = "password123";
    const passwordWorks = admin.password
      ? await bcrypt.compare(testPassword, admin.password)
      : false;

    // Generate a fresh hash for comparison
    const freshHash = await bcrypt.hash(testPassword, 10);
    const freshHashWorks = await bcrypt.compare(testPassword, freshHash);

    return NextResponse.json({
      adminExists: true,
      adminData: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        hasPassword: !!admin.password,
        passwordHashLength: admin.password?.length,
      },
      passwordTest: {
        testPasswordWorks: passwordWorks,
        freshHashGenerated: freshHash.substring(0, 20) + "...",
        freshHashWorks: freshHashWorks,
      },
      actualPasswordHash: admin.password?.substring(0, 30) + "...",
      instructions: passwordWorks
        ? "Password is correct! Login should work."
        : "Password hash is wrong! Use the correct SQL below.",
    });
  } catch (error) {
    return NextResponse.json({
      error: "Database error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
