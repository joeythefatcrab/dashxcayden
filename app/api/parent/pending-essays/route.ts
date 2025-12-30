import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all students for this parent
    const whereClause =
      session.user.role === "ADMIN"
        ? {} // Admins see all students
        : { parentId: session.user.id };

    const students = await db.student.findMany({
      where: whereClause,
      select: { id: true },
    });

    const studentIds = students.map((s) => s.id);

    // Get all submitted essays for these students
    const submissions = await db.essaySubmission.findMany({
      where: {
        studentId: { in: studentIds },
        status: "SUBMITTED",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        submittedAt: "asc", // Oldest first
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching pending essays:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending essays" },
      { status: 500 }
    );
  }
}
