import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Only SUPERADMIN can update signup code
    // @ts-ignore
    const userRole = session?.user?.realRole || session?.user?.role;
    if (!session?.user || userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { code } = await req.json();

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Upsert the signup code setting
    await db.systemSetting.upsert({
      where: { key: "signup_code" },
      update: { value: code.toUpperCase() },
      create: {
        key: "signup_code",
        value: code.toUpperCase(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Signup code updated successfully",
    });
  } catch (error) {
    console.error("Update signup code error:", error);
    return NextResponse.json(
      { error: "Failed to update signup code" },
      { status: 500 }
    );
  }
}
