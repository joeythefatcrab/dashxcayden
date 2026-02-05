import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, orderedIds } = await req.json();
    if (!type || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "type and orderedIds are required" },
        { status: 400 }
      );
    }

    const updates = orderedIds.map((id: string, idx: number) => {
      if (type === "unit") return db.unit.update({ where: { id }, data: { order: idx } });
      if (type === "lesson") return db.lesson.update({ where: { id }, data: { order: idx } });
      if (type === "item") return db.item.update({ where: { id }, data: { order: idx } });
      return Promise.resolve(null);
    });

    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
