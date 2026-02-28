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
    const { id, apsSubject } = body;

    if (!id) {
      return NextResponse.json({ error: "Curriculum id is required" }, { status: 400 });
    }

    const curriculum = await db.curriculum.update({
      where: { id },
      data: {
        // Only allow updating apsSubject via this endpoint (null clears it)
        apsSubject: apsSubject ?? null,
      },
      select: { id: true, name: true, apsSubject: true },
    });

    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Error updating curriculum:", error);
    return NextResponse.json({ error: "Failed to update curriculum" }, { status: 500 });
  }
}
