import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * ONE-TIME SETUP ENDPOINT
 * DELETE THIS FILE AFTER USE FOR SECURITY
 *
 * Usage: GET /api/setup/superadmin?email=your-email@example.com
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "Email parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Find and update the user
    const user = await db.user.update({
      where: { email },
      data: { role: "SUPERADMIN" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User promoted to SUPERADMIN",
      user,
      warning: "DELETE THE FILE app/api/setup/superadmin/route.ts NOW FOR SECURITY",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "User not found or update failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 404 }
    );
  }
}
