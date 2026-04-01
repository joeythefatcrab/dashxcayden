import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  // @ts-ignore
  const realRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(realRole ?? "")) {
    return NextResponse.json({ count: 0 });
  }

  const count = await db.monthlyReport.count({
    where: {
      submittedAt: { not: null },
      adminReviewed: false,
    },
  });

  return NextResponse.json({ count });
}
