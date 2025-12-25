import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    // Get note with student info
    const note = await db.note.findUnique({
      where: { id: noteId },
      include: {
        student: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permission
    const isOwnStudent = note.student.userId === session.user.id;
    const isParent = note.student.parentId === session.user.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(session.user.role);

    if (!isOwnStudent && !isParent && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedNote = await db.note.update({
      where: { id: noteId },
      data: { content },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get note with student info
    const note = await db.note.findUnique({
      where: { id: noteId },
      include: {
        student: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check permission
    const isOwnStudent = note.student.userId === session.user.id;
    const isParent = note.student.parentId === session.user.id;
    const isAdmin = ["ADMIN", "SUPERADMIN"].includes(session.user.role);

    if (!isOwnStudent && !isParent && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.note.delete({
      where: { id: noteId },
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
