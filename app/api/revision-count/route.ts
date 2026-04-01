import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/revision-count
// Returns a badge count relevant to the caller's role:
//   STUDENT   → essays returned for revision (PENDING + adminNote set)
//   PARENT    → same, across all their students
//   ADMIN/SA  → SUBMITTED essays waiting for review (pending approval queue)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ count: 0 });

    // @ts-ignore
    const role: string = session.user.realRole || session.user.role || "";
    const userId: string = session.user.id;

    if (role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!student) return NextResponse.json({ count: 0 });

      const count = await db.programItemCompletion.count({
        where: {
          status: "PENDING",
          adminNote: { not: null },
          item: { itemType: "ESSAY" },
          enrollment: { studentId: student.id },
        },
      });
      return NextResponse.json({ count });
    }

    if (role === "PARENT") {
      // All students belonging to this parent
      const students = await db.student.findMany({
        where: { parentId: userId },
        select: { id: true },
      });
      if (!students.length) return NextResponse.json({ count: 0 });

      const count = await db.programItemCompletion.count({
        where: {
          status: "PENDING",
          adminNote: { not: null },
          item: { itemType: "ESSAY" },
          enrollment: { studentId: { in: students.map((s) => s.id) } },
        },
      });
      return NextResponse.json({ count });
    }

    if (role === "ADMIN" || role === "SUPERADMIN") {
      // Essays submitted and waiting for admin review
      const count = await db.programItemCompletion.count({
        where: {
          status: "SUBMITTED",
          item: { itemType: "ESSAY", requiresReview: true },
        },
      });
      return NextResponse.json({ count });
    }

    return NextResponse.json({ count: 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
