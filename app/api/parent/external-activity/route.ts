import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reportId, title, description, date, hoursSpent, category } = body;

    if (!reportId || !title || !date) {
      return NextResponse.json(
        { error: "reportId, title, and date are required" },
        { status: 400 }
      );
    }

    // Verify the report belongs to this parent
    const report = await db.monthlyReport.findUnique({
      where: { id: reportId },
      select: { parentId: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (session.user.role === "PARENT" && report.parentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the external activity
    // Parse date string (YYYY-MM-DD) and create Date at midnight UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const activity = await db.externalActivity.create({
      data: {
        reportId,
        title,
        description,
        date: new Date(Date.UTC(year, month - 1, day)), // month is 0-indexed
        hoursSpent: hoursSpent ? parseFloat(hoursSpent) : null,
        category,
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

export async function DELETE(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership through the report
    const activity = await db.externalActivity.findUnique({
      where: { id: activityId },
      include: {
        report: {
          select: { parentId: true },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role === "PARENT" &&
      activity.report.parentId !== session.user.id
    ) {
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

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, date, hoursSpent, category } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 }
      );
    }

    // Verify ownership through the report
    const existingActivity = await db.externalActivity.findUnique({
      where: { id: activityId },
      include: {
        report: {
          select: { parentId: true },
        },
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    if (
      session.user.role === "PARENT" &&
      existingActivity.report.parentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the external activity
    // Parse date string (YYYY-MM-DD) and create Date at midnight UTC to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const activity = await db.externalActivity.update({
      where: { id: activityId },
      data: {
        title,
        description,
        date: new Date(Date.UTC(year, month - 1, day)), // month is 0-indexed
        hoursSpent: hoursSpent ? parseFloat(hoursSpent) : null,
        category,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating external activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}
