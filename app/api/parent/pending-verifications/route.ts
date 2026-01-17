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
    const students = await db.student.findMany({
      where: { parentId: session.user.id },
      select: { id: true },
    });

    const studentIds = students.map(s => s.id);

    // Count unverified time logs
    const unverifiedTimeLogsCount = await db.dailyTimeLog.count({
      where: {
        studentId: { in: studentIds },
        verifiedByParent: false,
      },
    });

    // Count unverified external activities
    const unverifiedActivitiesCount = await db.externalActivity.count({
      where: {
        report: {
          studentId: { in: studentIds },
        },
        verifiedByParent: false,
      },
    });

    const totalPending = unverifiedTimeLogsCount + unverifiedActivitiesCount;

    return NextResponse.json({
      totalPending,
      unverifiedTimeLogs: unverifiedTimeLogsCount,
      unverifiedActivities: unverifiedActivitiesCount,
    });
  } catch (error) {
    console.error("Error fetching pending verifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending verifications" },
      { status: 500 }
    );
  }
}
