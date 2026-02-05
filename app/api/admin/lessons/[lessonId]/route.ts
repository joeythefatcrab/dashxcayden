import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lessonId } = await params;
    const { title, description, contentMd, threshold, objectives, attachmentUrl } =
      await req.json();

    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(contentMd !== undefined && { contentMd }),
        ...(threshold !== undefined && { threshold }),
        ...(objectives !== undefined && { objectives }),
        ...(attachmentUrl !== undefined && { attachmentUrl }),
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lessonId } = await params;
    await db.lesson.delete({ where: { id: lessonId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
