import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // @ts-ignore
    const userRole: string = session?.user?.realRole || session?.user?.role || "";
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify the target user exists
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, name: true, organizationId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ADMIN can only impersonate PARENT and STUDENT (not other admins/superadmins)
    if (userRole === "ADMIN") {
      if (!["PARENT", "STUDENT"].includes(targetUser.role)) {
        return NextResponse.json(
          { error: "Admins can only impersonate parents and students" },
          { status: 403 }
        );
      }

      // Admins can only impersonate users in their own organization
      const adminUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
      });

      if (adminUser?.organizationId && targetUser.organizationId !== adminUser.organizationId) {
        return NextResponse.json(
          { error: "Cannot impersonate users outside your organization" },
          { status: 403 }
        );
      }
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

    console.log(`[IMPERSONATION] ${userRole} ${session.user.email} impersonating user ${targetUser.email}`);

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
