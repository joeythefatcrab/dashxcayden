import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/inngest/client";

/**
 * Test endpoint to manually trigger a digest for the current parent user
 */
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only parents can trigger their own digests
    // @ts-ignore - role exists in our session
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: "Only parents can trigger digests" },
        { status: 403 }
      );
    }

    const { frequency } = await req.json();

    if (!frequency || !["daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency. Must be 'daily' or 'weekly'" },
        { status: 400 }
      );
    }

    // Trigger the digest
    const result = await inngest.send({
      name: "digest/send.parent",
      data: {
        parentId: session.user.id,
        frequency,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${frequency} digest triggered successfully`,
      eventId: result.ids[0],
    });
  } catch (error) {
    console.error("Error triggering digest:", error);
    return NextResponse.json(
      {
        error: "Failed to trigger digest",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
