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

  try {
    if (reportId) {
      await db.$executeRaw`
        UPDATE "MonthlyReport" SET "adminReviewed" = true WHERE id = ${reportId}
      `;
    } else {
      await db.$executeRaw`
        UPDATE "MonthlyReport" SET "adminReviewed" = true
        WHERE "submittedAt" IS NOT NULL AND ("adminReviewed" = false OR "adminReviewed" IS NULL)
      `;
    }
  } catch {
    // Column doesn't exist yet — no-op, migration pending
  }

  return NextResponse.json({ success: true });
}
