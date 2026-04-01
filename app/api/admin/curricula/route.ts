import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH /api/admin/curricula — update curriculum metadata (apsSubject, name, subject, etc.)
export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, apsSubject, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Curriculum id is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      apsSubject: apsSubject ?? null,
    };
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description.trim() || null;

    const curriculum = await db.curriculum.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, description: true, apsSubject: true },
    });

    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Error updating curriculum:", error);
    return NextResponse.json({ error: "Failed to update curriculum" }, { status: 500 });
  }
}
