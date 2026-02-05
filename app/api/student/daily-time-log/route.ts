import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { date, logs } = body;

    if (!date || !logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: "date and logs array are required" },
        { status: 400 }
      );
    }

    // Get student profile
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Parse date as UTC to avoid timezone issues
    const [year, month, day] = date.split("-").map(Number);
    const logDate = new Date(Date.UTC(year, month - 1, day));

    // Create or update time logs for each curriculum
    const results = await Promise.all(
      logs.map(async (log: { curriculumId: string; minutesSpent: number }) => {
        return db.dailyTimeLog.upsert({
          where: {
            studentId_date_curriculumId: {
              studentId: student.id,
              date: logDate,
              curriculumId: log.curriculumId,
            },
          },
          update: {
            minutesSpent: log.minutesSpent,
          },
          create: {
            studentId: student.id,
            date: logDate,
            curriculumId: log.curriculumId,
            minutesSpent: log.minutesSpent,
          },
        });
      })
    );

    return NextResponse.json({ success: true, logs: results });
  } catch (error) {
    console.error("Error saving daily time log:", error);
    return NextResponse.json(
      { error: "Failed to save time log" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get student profile
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Check if time log is needed for yesterday (pure UTC to avoid timezone drift)
    const now = new Date();
    const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get enrolled curricula
    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        curriculum: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        needsTimeLog: false,
        reason: "no_enrollments",
      });
    }

    // Check if logs exist for yesterday
    const existingLogs = await db.dailyTimeLog.findMany({
      where: {
        studentId: student.id,
        date: yesterday,
      },
    });

    const needsTimeLog = existingLogs.length === 0;

    return NextResponse.json({
      needsTimeLog,
      date: yesterdayStr,
      curricula: enrollments.map((e) => e.curriculum),
    });
  } catch (error) {
    console.error("Error checking time log:", error);
    return NextResponse.json(
      { error: "Failed to check time log" },
      { status: 500 }
    );
  }
}
