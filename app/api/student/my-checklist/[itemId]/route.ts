import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/student/my-checklist/[itemId]
// Body: { enrollmentId, status, content? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { enrollmentId, status, content } = await req.json();
    if (!enrollmentId || !status) {
      return NextResponse.json({ error: "enrollmentId and status required" }, { status: 400 });
    }

    const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "DONE", "SUBMITTED", "OPT_OUT", "MOVE"];
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify enrollment exists
    const enrollment = await db.programEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    // Upsert completion
    const completion = await db.programItemCompletion.upsert({
      where: { enrollmentId_itemId: { enrollmentId, itemId } },
      update: {
        status,
        content: content ?? undefined,
        completedAt: status === "DONE" || status === "SUBMITTED" ? new Date() : undefined,
      },
      create: {
        enrollmentId,
        itemId,
        status,
        content: content ?? null,
        completedAt: status === "DONE" || status === "SUBMITTED" ? new Date() : null,
      },
    });

    return NextResponse.json(completion);
  } catch (error) {
    console.error("my-checklist POST error:", error);
    return NextResponse.json({ error: "Failed to update completion" }, { status: 500 });
  }
}
