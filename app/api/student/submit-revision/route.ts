import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { attemptId, itemId, newAnswer } = body;

    if (!attemptId || !itemId || !newAnswer?.trim()) {
      return NextResponse.json(
        { error: "Attempt ID, item ID, and new answer are required" },
        { status: 400 }
      );
    }

    // Get student record from user ID
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    // Get attempt and verify student owns it
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.studentId !== student.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the attempt detail with the new answer
    const detail = attempt.detail as any;

    if (!detail[itemId]) {
      return NextResponse.json(
        { error: "Item not found in attempt" },
        { status: 404 }
      );
    }

    // Verify the item was actually marked for revision
    if (!detail[itemId].revisionRequested) {
      return NextResponse.json(
        { error: "This item was not marked for revision" },
        { status: 400 }
      );
    }

    // Update the item with new answer and mark for grading
    detail[itemId] = {
      ...detail[itemId],
      answer: newAnswer.trim(),
      revisionRequested: false,
      revisionNote: null,
      revisionRequestedAt: null,
      revisionRequestedBy: null,
      needsGrading: true, // Mark for grading again
      resubmittedAt: new Date().toISOString(),
    };

    // Update the attempt
    const updated = await db.attempt.update({
      where: { id: attemptId },
      data: {
        detail,
      },
    });

    return NextResponse.json({
      success: true,
      attempt: updated,
      message: "Revision submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting revision:", error);
    return NextResponse.json(
      { error: "Failed to submit revision" },
      { status: 500 }
    );
  }
}
