import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("id");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID required" },
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

    // Check permission: admin or student's parent
    if (
      session.user.role === "PARENT" &&
      submission.student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the submission
    await db.essaySubmission.delete({
      where: { id: submissionId },
    });

    return NextResponse.json({
      success: true,
      message: "Essay deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting essay:", error);
    return NextResponse.json(
      { error: "Failed to delete essay" },
      { status: 500 }
    );
  }
}
