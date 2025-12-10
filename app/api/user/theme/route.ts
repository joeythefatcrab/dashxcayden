import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * API endpoint to update user theme preference
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { theme } = await request.json();

  // Validate theme value
  const validThemes = ["light", "dark", "system"];
  if (!validThemes.includes(theme)) {
    return NextResponse.json({ error: "Invalid theme value" }, { status: 400 });
  }

  try {
    // Update user's theme preference
    await db.user.update({
      where: { id: session.user.id },
      data: { theme },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error("Failed to update theme:", error);
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 });
  }
}

/**
 * Get user's current theme preference
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });

    return NextResponse.json({ theme: user?.theme || "light" });
  } catch (error) {
    console.error("Failed to get theme:", error);
    return NextResponse.json({ error: "Failed to get theme" }, { status: 500 });
  }
}
