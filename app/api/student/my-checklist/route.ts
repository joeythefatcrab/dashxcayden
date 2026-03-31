import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/student/my-checklist?studentId=xxx&programId=xxx
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const programId = searchParams.get("programId");

    if (!studentId || !programId) {
      return NextResponse.json({ error: "studentId and programId required" }, { status: 400 });
    }

    // Find the enrollment so we can fetch completions
    const enrollment = await db.programEnrollment.findUnique({
      where: { programId_studentId: { programId, studentId } },
    });

    // Fetch all checklist items for this program
    const items = await db.programChecklistItem.findMany({
      where: { programId },
      orderBy: { order: "asc" },
    });

    // Fetch completions for this enrollment (if any)
    const completions = enrollment
      ? await db.programItemCompletion.findMany({
          where: { enrollmentId: enrollment.id },
        })
      : [];

    const completionMap = new Map(completions.map((c) => [c.itemId, c]));

    // Group by section
    const sectionMap = new Map<string, any[]>();
    for (const item of items) {
      const key = item.sectionTitle || "General";
      if (!sectionMap.has(key)) sectionMap.set(key, []);
      sectionMap.get(key)!.push({
        ...item,
        completion: completionMap.get(item.id) ?? null,
      });
    }

    const sections = Array.from(sectionMap.entries()).map(([title, items]) => ({
      title,
      items,
    }));

    return NextResponse.json({ sections, enrollmentId: enrollment?.id ?? null });
  } catch (error) {
    console.error("my-checklist GET error:", error);
    return NextResponse.json({ error: "Failed to load checklist" }, { status: 500 });
  }
}
