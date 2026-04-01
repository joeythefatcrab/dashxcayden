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

  try {
    // Use raw SQL so this works even before the adminReviewed migration is applied
    const result = await db.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM "MonthlyReport"
      WHERE "submittedAt" IS NOT NULL
        AND ("adminReviewed" = false OR "adminReviewed" IS NULL)
    `;
    return NextResponse.json({ count: Number(result[0]?.count ?? 0) });
  } catch {
    // Column doesn't exist yet — return 0 gracefully
    return NextResponse.json({ count: 0 });
  }
}
