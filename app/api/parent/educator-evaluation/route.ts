import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PARENT", "ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { reportId, answers } = body;

    if (!reportId || !answers) {
      return NextResponse.json(
        { error: "Report ID and answers are required" },
        { status: 400 }
      );
    }

    // Verify ownership if parent
    if (session.user.role === "PARENT") {
      const report = await db.monthlyReport.findUnique({
        where: { id: reportId },
        select: { parentId: true },
      });

      if (!report || report.parentId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update the report with educator evaluation answers
    const updatedReport = await db.monthlyReport.update({
      where: { id: reportId },
      data: {
        educatorEvaluation: answers,
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error saving educator evaluation:", error);
    return NextResponse.json(
      { error: "Failed to save educator evaluation" },
      { status: 500 }
    );
  }
}
