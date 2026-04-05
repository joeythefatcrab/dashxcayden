import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await auth();
  // @ts-ignore
  const role = session?.user?.realRole || session?.user?.role;
  if (!session?.user || role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportId } = await params;
  const body = await req.json();

  // Allow null to clear the override
  const override = body.override === null ? null : body.override;

  if (override !== null && typeof override !== "object") {
    return NextResponse.json({ error: "override must be a JSON object or null" }, { status: 400 });
  }

  try {
    await db.$executeRaw`
      UPDATE "MonthlyReport" SET "superadminOverride" = ${override === null ? null : JSON.stringify(override)}::jsonb
      WHERE id = ${reportId}
    `;
  } catch (e: any) {
    if (e?.code === "P2022" || String(e).includes("superadminOverride")) {
      return NextResponse.json({ error: "Run migration first: ALTER TABLE \"MonthlyReport\" ADD COLUMN IF NOT EXISTS \"superadminOverride\" JSONB;" }, { status: 500 });
    }
    throw e;
  }

  return NextResponse.json({ id: reportId, superadminOverride: override });
}
