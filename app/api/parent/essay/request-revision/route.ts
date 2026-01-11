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
    const { submissionId, revisionNote } = body;

    if (!submissionId || !revisionNote?.trim()) {
      return NextResponse.json(
        { error: "Submission ID and revision note are required" },
        { status: 400 }
      );
    }

    // Get submission and verify parent owns the student
    const submission = await db.essaySubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            parentId: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role === "PARENT" &&
      submission.student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure it's submitted
    if (submission.status !== "SUBMITTED" && submission.status !== "GRADED") {
      return NextResponse.json(
        { error: "Can only request revision on submitted essays" },
        { status: 400 }
      );
    }

    // Update status to REVISION_REQUESTED
    const updated = await db.essaySubmission.update({
      where: { id: submissionId },
      data: {
        status: "REVISION_REQUESTED",
        revisionNote: revisionNote.trim(),
        revisionRequestedAt: new Date(),
        revisionRequestedBy: session.user.id,
        // Clear grading data if it was previously graded
        grade: null,
        feedback: null,
        gradedAt: null,
        gradedBy: null,
      },
    });

    return NextResponse.json({
      success: true,
      submission: updated,
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
