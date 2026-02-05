import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { markAttendance } from "@/lib/attendance";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can log time" }, { status: 403 });
    }

    // Get student record
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { date, curriculumId, minutesSpent } = body;

    if (!date || !curriculumId || !minutesSpent) {
      return NextResponse.json(
        { error: "Date, curriculum ID, and minutes spent are required" },
        { status: 400 }
      );
    }

    // Verify student is enrolled in this curriculum
    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_curriculumId: {
          studentId: student.id,
          curriculumId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this course" },
        { status: 403 }
      );
    }

    // Parse the date as UTC to avoid timezone drift
    const [yr, mo, dy] = date.split("-").map(Number);
    const logDate = new Date(Date.UTC(yr, mo - 1, dy));

    // Create or update time log
    const timeLog = await db.dailyTimeLog.upsert({
      where: {
        studentId_date_curriculumId: {
          studentId: student.id,
          date: logDate,
          curriculumId,
        },
      },
      update: {
        minutesSpent,
        submittedBy: "student",
      },
      create: {
        studentId: student.id,
        date: logDate,
        curriculumId,
        minutesSpent,
        submittedBy: "student",
      },
    });

    // Auto-mark attendance for this date
    await markAttendance(student.id, logDate);

    return NextResponse.json({ success: true, timeLog });
  } catch (error) {
    console.error("Error logging time:", error);
    return NextResponse.json(
      { error: "Failed to log time" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch time logs
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can view their time logs" }, { status: 403 });
    }

    // Get student record
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get query params for date range
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const timeLogs = await db.dailyTimeLog.findMany({
      where: {
        studentId: student.id,
        ...dateFilter,
      },
      include: {
        curriculum: {
          select: {
            name: true,
            subject: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ timeLogs });
  } catch (error) {
    console.error("Error fetching time logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch time logs" },
      { status: 500 }
    );
  }
}
