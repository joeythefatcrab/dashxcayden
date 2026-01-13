import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Only SUPERADMIN can impersonate
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify the target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Store impersonation in cookie
    const cookieStore = await cookies();
    cookieStore.set("impersonate_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    // Store original admin ID to track who is impersonating
    cookieStore.set("impersonate_admin_id", session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    console.log(`[IMPERSONATION] Admin ${session.user.email} impersonating user ${targetUser.email}`);

    return NextResponse.json({
      success: true,
      message: `Now impersonating ${targetUser.email}`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json(
      { error: "Failed to impersonate user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Clear impersonation cookies
    const cookieStore = await cookies();
    cookieStore.delete("impersonate_user_id");
    cookieStore.delete("impersonate_admin_id");

    console.log(`[IMPERSONATION] Ending impersonation for admin ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Impersonation ended",
    });
  } catch (error) {
    console.error("End impersonation error:", error);
    return NextResponse.json(
      { error: "Failed to end impersonation" },
      { status: 500 }
    );
  }
}
