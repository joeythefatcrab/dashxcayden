import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { digestFrequency, notifyEmail, emailPrefsJson } = await req.json();

    // Validate input
    if (!["daily", "weekly", "none"].includes(digestFrequency)) {
      return NextResponse.json(
        { error: "Invalid digest frequency" },
        { status: 400 }
      );
    }

    if (typeof notifyEmail !== "boolean") {
      return NextResponse.json(
        { error: "Invalid notifyEmail value" },
        { status: 400 }
      );
    }

    // Validate emailPrefsJson is valid JSON if provided
    let prefsJson = "{}";
    if (emailPrefsJson) {
      try {
        JSON.parse(emailPrefsJson); // validate
        prefsJson = emailPrefsJson;
      } catch {
        return NextResponse.json({ error: "Invalid emailPrefsJson" }, { status: 400 });
      }
    }

    // Update user preferences
    await db.user.update({
      where: { id: session.user.id },
      data: {
        digestFrequency,
        notifyEmail,
        emailPrefsJson: prefsJson,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
