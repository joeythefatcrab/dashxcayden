import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { unitId, title, description, contentMd, threshold, objectives } =
      await req.json();
    if (!unitId || !title) {
      return NextResponse.json(
        { error: "unitId and title are required" },
        { status: 400 }
      );
    }

    const maxOrder = await db.lesson.aggregate({
      _max: { order: true },
      where: { unitId },
    });

    const lesson = await db.lesson.create({
      data: {
        unitId,
        title,
        description: description || null,
        contentMd: contentMd || "",
        threshold: threshold ?? 70,
        order: (maxOrder._max.order ?? -1) + 1,
        objectives: objectives || [],
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
