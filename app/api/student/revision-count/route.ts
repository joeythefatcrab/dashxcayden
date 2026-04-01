import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/student/revision-count
// Returns count of essay completions that have been returned for revision
// (status=PENDING with an adminNote set) for the current student.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ count: 0 });

    // @ts-ignore
    const userId = session.user.id;
    // @ts-ignore
    const role = session.user.realRole || session.user.role;

    // Students look up their own student record
    if (role !== "STUDENT") return NextResponse.json({ count: 0 });

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
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
