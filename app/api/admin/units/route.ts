import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { curriculumId, title, description } = await req.json();
    if (!curriculumId || !title) {
      return NextResponse.json(
        { error: "curriculumId and title are required" },
        { status: 400 }
      );
    }

    const maxOrder = await db.unit.aggregate({
      _max: { order: true },
      where: { curriculumId },
    });

    const unit = await db.unit.create({
      data: {
        curriculumId,
        title,
        description: description || null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
