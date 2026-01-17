import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get students for this parent
    const students = await db.student.findMany({
      where: { parentId: session.user.id },
      select: {
        id: true,
        name: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json({ recentLogs: [] });
    }

    // Get recent logs from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentLogs: Array<{
      studentName: string;
      date: string;
      type: "time" | "activity";
    }> = [];

    const studentIds = students.map((s) => s.id);

    // Get recent time logs
    const timeLogs = await db.dailyTimeLog.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    // Get recent activities
    const activities = await db.externalActivity.findMany({
      where: {
        report: {
          studentId: {
            in: studentIds,
          },
        },
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        report: {
          include: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 10,
    });

    // Combine and format logs
    timeLogs.forEach((log) => {
      recentLogs.push({
        studentName: log.student.name,
        date: log.date.toISOString(),
        type: "time",
      });
    });

    activities.forEach((activity) => {
      recentLogs.push({
        studentName: activity.report.student.name,
        date: activity.date.toISOString(),
        type: "activity",
      });
    });

    // Sort by date descending and take top 5
    recentLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const topRecentLogs = recentLogs.slice(0, 5);

    return NextResponse.json({
      recentLogs: topRecentLogs,
    });
  } catch (error) {
    console.error("Error fetching recent logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent logs" },
      { status: 500 }
    );
  }
}
