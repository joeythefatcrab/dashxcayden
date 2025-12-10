import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

/**
 * API endpoint for superadmins to impersonate other roles for QA testing
 * Sets a cookie that overrides the user's role in auth checks
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  // Only SUPERADMIN can impersonate roles
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await request.json();

  // Validate role
  const validRoles = ["ADMIN", "PARENT", "STUDENT", "TEACHER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Set impersonation cookie
  const cookieStore = await cookies();
  cookieStore.set("impersonate_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return NextResponse.json({ success: true, role });
}

/**
 * Clear impersonation and return to real role
 */
export async function DELETE() {
  const session = await auth();

  // Only SUPERADMIN can clear impersonation
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear the cookie
  const cookieStore = await cookies();
  cookieStore.delete("impersonate_role");

  return NextResponse.json({ success: true });
}
