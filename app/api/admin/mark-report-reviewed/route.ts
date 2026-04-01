import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  // @ts-ignore
  const realRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(realRole ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { reportId } = await req.json();

  if (reportId) {
    // Mark a single report reviewed
    await db.monthlyReport.update({
      where: { id: reportId },
      data: { adminReviewed: true },
    });
  } else {
    // Mark all pending reports reviewed (used when admin dismisses the banner)
    await db.monthlyReport.updateMany({
      where: { submittedAt: { not: null }, adminReviewed: false },
      data: { adminReviewed: true },
    });
  }

  return NextResponse.json({ success: true });
}
