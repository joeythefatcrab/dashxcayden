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
      return NextResponse.json({ error: "Only students can submit activities" }, { status: 403 });
    }

    // Get student record
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        parentId: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, date, hoursSpent, category } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 }
      );
    }

    // Parse date to get month and year
    const activityDate = new Date(date);
    const month = activityDate.getMonth() + 1; // 0-indexed, so add 1
    const year = activityDate.getFullYear();

    // Find or create monthly report for this student and month
    let monthlyReport = await db.monthlyReport.findUnique({
      where: {
        studentId_month_year: {
          studentId: student.id,
          month,
          year,
        },
      },
    });

    if (!monthlyReport) {
      // Create a new monthly report
      monthlyReport = await db.monthlyReport.create({
        data: {
          studentId: student.id,
          parentId: student.parentId,
          month,
          year,
        },
      });
    }

    // Create the external activity with verification tracking
    const [activityYear, activityMonth, activityDay] = date.split('-').map(Number);
    const activity = await db.externalActivity.create({
      data: {
        reportId: monthlyReport.id,
        title,
        description,
        date: new Date(Date.UTC(activityYear, activityMonth - 1, activityDay)),
        hoursSpent: hoursSpent ? parseFloat(hoursSpent) : null,
        category,
        verifiedByParent: false,
        submittedBy: "student",
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error creating external activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch student's external activities
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can view their activities" }, { status: 403 });
    }

    // Get student record
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // Find monthly reports for this student
    let reportFilter: any = {
      studentId: student.id,
    };

    if (month && year) {
      reportFilter.month = parseInt(month);
      reportFilter.year = parseInt(year);
    }

    const reports = await db.monthlyReport.findMany({
      where: reportFilter,
      include: {
        externalActivities: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    // Flatten all external activities from all reports
    const activities = reports.flatMap(report => report.externalActivities);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching external activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete student's own activities
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can delete their activities" }, { status: 403 });
    }

    // Get student record
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    // Verify activity belongs to this student
    const activity = await db.externalActivity.findUnique({
      where: { id: activityId },
      include: {
        report: {
          select: { studentId: true },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (activity.report.studentId !== student.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.externalActivity.delete({
      where: { id: activityId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting external activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}
