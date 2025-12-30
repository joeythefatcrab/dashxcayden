import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, grade, feedback } = body;

    if (!submissionId || grade === undefined) {
      return NextResponse.json(
        { error: "submissionId and grade are required" },
        { status: 400 }
      );
    }

    // Validate grade
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      return NextResponse.json(
        { error: "Grade must be between 0 and 100" },
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
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
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
        { error: "Can only grade submitted essays" },
        { status: 400 }
      );
    }

    // Update with grade
    const graded = await db.essaySubmission.update({
      where: { id: submissionId },
      data: {
        status: "GRADED",
        grade: gradeNum,
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedBy: session.user.id,
      },
    });

    return NextResponse.json(graded);
  } catch (error) {
    console.error("Error grading essay:", error);
    return NextResponse.json(
      { error: "Failed to grade essay" },
      { status: 500 }
    );
  }
}
