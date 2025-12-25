import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const lessonId = searchParams.get("lessonId");
    const itemId = searchParams.get("itemId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Verify access to student
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check permission: student's own user, parent, or admin
    const isOwnStudent = student.userId === session.user.id;
    const isParent = student.parentId === session.user.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(session.user.role);

    if (!isOwnStudent && !isParent && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build query
    const where: any = { studentId };
    if (lessonId) where.lessonId = lessonId;
    if (itemId) where.itemId = itemId;

    const notes = await db.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, lessonId, itemId, content } = body;

    if (!studentId || !content) {
      return NextResponse.json(
        { error: "Student ID and content required" },
        { status: 400 }
      );
    }

    // Verify access to student
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check permission
    const isOwnStudent = student.userId === session.user.id;
    const isParent = student.parentId === session.user.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(session.user.role);

    if (!isOwnStudent && !isParent && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const note = await db.note.create({
      data: {
        studentId,
        lessonId: lessonId || null,
        itemId: itemId || null,
        content,
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
