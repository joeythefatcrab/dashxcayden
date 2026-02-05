import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record
    const student = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Find all essay submissions with REVISION_REQUESTED status
    const revisionRequests = await db.essaySubmission.findMany({
      where: {
        studentId: student.id,
        status: "REVISION_REQUESTED",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        revisionRequestedAt: "desc",
      },
    });

    // Fetch lesson titles for each request
    const enrichedRequests = await Promise.all(
      revisionRequests.map(async (request) => {
        const lesson = await db.lesson.findUnique({
          where: { id: request.lessonId },
          select: { title: true, unitId: true },
        });

        const unit = lesson
          ? await db.unit.findUnique({
              where: { id: lesson.unitId },
              select: { curriculumId: true },
            })
          : null;

        return {
          id: request.id,
          itemId: request.itemId,
          lessonId: unit ? `${unit.curriculumId}/lessons/${request.lessonId}` : request.lessonId,
          revisionNote: request.revisionNote,
          revisionRequestedAt: request.revisionRequestedAt,
          lessonTitle: lesson?.title,
        };
      })
    );

    return NextResponse.json(enrichedRequests);
  } catch (error) {
    console.error("Error fetching revision requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch revision requests" },
      { status: 500 }
    );
  }
}
