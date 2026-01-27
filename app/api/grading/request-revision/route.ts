import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { attemptId, revisionNote } = body;

    if (!attemptId || !revisionNote?.trim()) {
      return NextResponse.json(
        { error: "Attempt ID and revision note are required" },
        { status: 400 }
      );
    }

    // Get attempt and verify parent owns the student
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          select: {
            parentId: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role === "PARENT" &&
      attempt.student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update attempt to mark items as needing revision
    const detail = attempt.detail as any;

    // Mark all items that needed grading as needing revision
    Object.keys(detail).forEach((itemId) => {
      if (detail[itemId].needsGrading) {
        detail[itemId].revisionRequested = true;
        detail[itemId].revisionNote = revisionNote.trim();
        detail[itemId].revisionRequestedAt = new Date().toISOString();
        detail[itemId].revisionRequestedBy = session.user.id;
        // Clear any previous grading
        detail[itemId].points = 0;
        detail[itemId].feedback = "";
        detail[itemId].needsGrading = false; // No longer needs grading, needs revision
      }
    });

    // Update the attempt
    const updated = await db.attempt.update({
      where: { id: attemptId },
      data: {
        detail,
        // Don't change the score - keep it as pending
      },
    });

    return NextResponse.json({
      success: true,
      attempt: updated,
      message: "Revision requested successfully",
    });
  } catch (error) {
    console.error("Error requesting revision:", error);
    return NextResponse.json(
      { error: "Failed to request revision" },
      { status: 500 }
    );
  }
}
