import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET - Fetch all notes for a student
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
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

    // Fetch all notes for this student, ordered by most recent
    const notes = await db.note.findMany({
      where: { studentId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        lessonId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, title, content, lessonId } = body;

    if (!studentId || !content) {
      return NextResponse.json(
        { error: "studentId and content are required" },
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

    // Create the note
    const note = await db.note.create({
      data: {
        studentId,
        title: title || null,
        content,
        lessonId: lessonId || null,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// PUT - Update a note
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, content } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: "id and content are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingNote = await db.note.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            userId: true,
            parentId: true,
          },
        },
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (
      existingNote.student.userId !== session.user.id &&
      existingNote.student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the note
    const note = await db.note.update({
      where: { id },
      data: {
        title: title || null,
        content,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const existingNote = await db.note.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            userId: true,
            parentId: true,
          },
        },
      },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (
      existingNote.student.userId !== session.user.id &&
      existingNote.student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the note
    await db.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
