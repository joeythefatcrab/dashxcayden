import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// TEMPORARY FIX ENDPOINT - Run once then delete
export async function POST() {
  try {
    // Generate a fresh bcrypt hash for "password123"
    const correctHash = await bcrypt.hash("password123", 10);

    // Update all test accounts with the correct hash
    await db.user.updateMany({
      where: {
        email: {
          in: [
            "admin@homeschool.com",
            "parent1@homeschool.com",
            "parent2@homeschool.com",
            "parent3@homeschool.com",
          ],
        },
      },
      data: {
        password: correctHash,
      },
    });

    // Verify it worked
    const admin = await db.user.findUnique({
      where: { email: "admin@homeschool.com" },
    });

    const testWorks = admin?.password
      ? await bcrypt.compare("password123", admin.password)
      : false;

    return NextResponse.json({
      success: true,
      message: "Password hashes updated successfully!",
      newHash: correctHash,
      testResult: testWorks,
      instructions: testWorks
        ? "✅ Login should work now! Try: admin@homeschool.com / password123"
        : "❌ Something went wrong, please check the database",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
