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

  const report = await db.monthlyReport.update({
    where: { id: reportId },
    data: { superadminOverride: override ?? undefined },
    select: { id: true, superadminOverride: true },
  });

  return NextResponse.json(report);
}
