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
    const { logId, approve } = body;

    if (!logId || approve === undefined) {
      return NextResponse.json(
        { error: "logId and approve are required" },
        { status: 400 }
      );
    }

    // Verify the log belongs to this parent's student
    const timeLog = await db.dailyTimeLog.findUnique({
      where: { id: logId },
      include: {
        student: {
          select: {
            parentId: true,
          },
        },
      },
    });

    if (!timeLog) {
      return NextResponse.json({ error: "Time log not found" }, { status: 404 });
    }

    if (timeLog.student.parentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (approve) {
      // Approve the time log
      await db.dailyTimeLog.update({
        where: { id: logId },
        data: {
          verifiedByParent: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
        },
      });
    } else {
      // Reject - delete the time log
      await db.dailyTimeLog.delete({
        where: { id: logId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying time log:", error);
    return NextResponse.json(
      { error: "Failed to verify time log" },
      { status: 500 }
    );
  }
}
