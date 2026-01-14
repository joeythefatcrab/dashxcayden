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

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const month = parseInt(searchParams.get("month") || "");
    const year = parseInt(searchParams.get("year") || "");

    if (!studentId || !month || !year) {
      return NextResponse.json(
        { error: "studentId, month, and year are required" },
        { status: 400 }
      );
    }

    // Verify parent owns this student
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        grade: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (
      session.user.role === "PARENT" &&
      student.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get or create the monthly report
    let report = await db.monthlyReport.findUnique({
      where: {
        studentId_month_year: {
          studentId,
          month,
          year,
        },
      },
      include: {
        externalActivities: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!report) {
      report = await db.monthlyReport.create({
        data: {
          studentId,
          parentId: student.parentId,
          month,
          year,
        },
        include: {
          externalActivities: true,
        },
      });
    }

    // Get course activity data for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all enrollments for this student
    const enrollments = await db.enrollment.findMany({
      where: { studentId },
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

    // Get attempts for this month
    const attempts = await db.attempt.findMany({
      where: {
        studentId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            unit: {
              select: {
                curriculumId: true,
              },
            },
          },
        },
      },
    });
    // Get daily time logs for this month
    const dailyTimeLogs = await db.dailyTimeLog.findMany({
      where: {
        studentId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        curriculumId: true,
        minutesSpent: true,
      },
    });

    // Calculate course statistics
    const courseStats = enrollments.map((enrollment) => {
      const courseAttempts = attempts.filter(
        (a) => a.lesson.unit.curriculumId === enrollment.curriculum.id
      );

      const uniqueLessons = new Set(courseAttempts.map((a) => a.lessonId));
      const totalTime = courseAttempts.reduce(
        (sum: number, a: any) => sum + (a.timeSpent || 0),
        0
      );

      // Get daily time log minutes for this curriculum
      const timeLogMinutes = dailyTimeLogs
        .filter((log) => log.curriculumId === enrollment.curriculum.id)
        .reduce((sum, log) => sum + log.minutesSpent, 0);

      // Combine attempt time with daily log time (convert minutes to seconds)
      const totalTimeSeconds = totalTime + (timeLogMinutes * 60);

      const avgScore =
        courseAttempts.length > 0
          ? courseAttempts.reduce((sum: number, a: any) => sum + a.score, 0) /
            courseAttempts.length
          : 0;

      return {
        curriculumId: enrollment.curriculum.id,
        name: enrollment.curriculum.name,
        subject: enrollment.curriculum.subject,
        lessonsCompleted: uniqueLessons.size,
        averageScore: Math.round(avgScore),
        timeSpentSeconds: totalTimeSeconds,
        timeSpentHours: parseFloat((totalTimeSeconds / 3600).toFixed(1)),
      };
    });

    // Calculate total time
    const totalAppSeconds = attempts.reduce(
      (sum: number, a: any) => sum + (a.timeSpent || 0),
      0
    );
    // Add daily time log minutes (converted to seconds)
    const totalTimeLogMinutes = dailyTimeLogs.reduce(
      (sum, log) => sum + log.minutesSpent,
      0
    );
    const totalTimeLogSeconds = totalTimeLogMinutes * 60;

    const totalAppHours = parseFloat(((totalAppSeconds + totalTimeLogSeconds) / 3600).toFixed(1));

    const totalExternalHours = report.externalActivities.reduce(
      (sum: number, activity: any) => sum + (activity.hoursSpent || 0),
      0
    );

    const totalSchoolHours = parseFloat(
      (totalAppHours + totalExternalHours).toFixed(1)
    );

    return NextResponse.json({
      report,
      student,
      month,
      year,
      courseStats,
      summary: {
        totalAppHours,
        totalExternalHours,
        totalSchoolHours,
        totalLessonsCompleted: attempts.length,
        totalCourses: courseStats.length,
      },
    });
  } catch (error) {
    console.error("Error fetching monthly report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
