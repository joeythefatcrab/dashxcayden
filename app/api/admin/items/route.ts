import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lessonId, type, prompt, choices, answerKey, points, isOptional } =
      await req.json();
    if (!lessonId || !type || !prompt) {
      return NextResponse.json(
        { error: "lessonId, type, and prompt are required" },
        { status: 400 }
      );
    }

    const maxOrder = await db.item.aggregate({
      _max: { order: true },
      where: { lessonId },
    });

    const item = await db.item.create({
      data: {
        lessonId,
        type,
        prompt,
        order: (maxOrder._max.order ?? -1) + 1,
        choices: choices || null,
        answerKey: answerKey || {},
        points: points ?? 1,
        isOptional: isOptional ?? false,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
