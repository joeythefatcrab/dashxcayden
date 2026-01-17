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
    const { activityId, approve } = body;

    if (!activityId || approve === undefined) {
      return NextResponse.json(
        { error: "activityId and approve are required" },
        { status: 400 }
      );
    }

    // Verify the activity belongs to this parent's student
    const activity = await db.externalActivity.findUnique({
      where: { id: activityId },
      include: {
        report: {
          select: {
            parentId: true,
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    if (activity.report.parentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (approve) {
      // Approve the activity
      await db.externalActivity.update({
        where: { id: activityId },
        data: {
          verifiedByParent: true,
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
        },
      });
    } else {
      // Reject - delete the activity
      await db.externalActivity.delete({
        where: { id: activityId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying activity:", error);
    return NextResponse.json(
      { error: "Failed to verify activity" },
      { status: 500 }
    );
  }
}
