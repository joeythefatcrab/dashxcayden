import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Fetch essay submission
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const itemId = searchParams.get("itemId");

    if (!studentId || !itemId) {
      return NextResponse.json(
        { error: "studentId and itemId are required" },
        { status: 400 }
      );
    }

    // Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find submission
    const submission = await db.essaySubmission.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching essay submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// POST - Create or update essay submission
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, lessonId, itemId, content, status } = body;

    if (!studentId || !lessonId || !itemId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify student ownership
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        OR: [
          { userId: session.user.id },
          { parent: { id: session.user.id } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if submission already exists
    const existing = await db.essaySubmission.findUnique({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
    });

    // Don't allow editing after submission
    if (existing && existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot edit submitted essay" },
        { status: 400 }
      );
    }

    // Create or update submission
    const submission = await db.essaySubmission.upsert({
      where: {
        studentId_itemId: {
          studentId,
          itemId,
        },
      },
      update: {
        content,
        status: status || "DRAFT",
        submittedAt: status === "SUBMITTED" ? new Date() : existing?.submittedAt,
      },
      create: {
        studentId,
        lessonId,
        itemId,
        content,
        status: status || "DRAFT",
        submittedAt: status === "SUBMITTED" ? new Date() : null,
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error saving essay submission:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}
