import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Debug endpoint to check database state
 * REMOVE THIS IN PRODUCTION!
 */
export async function GET() {
  try {
    // Check if database is accessible
    const userCount = await db.user.count();

    // Get sample users (without passwords)
    const users = await db.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        password: false, // Don't return passwords
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if theme column exists by trying to query it
    let themeColumnExists = false;
    try {
      await db.user.findFirst({
        select: { theme: true },
      });
      themeColumnExists = true;
    } catch (error) {
      themeColumnExists = false;
    }

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        themeColumnExists,
        recentUsers: users,
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
