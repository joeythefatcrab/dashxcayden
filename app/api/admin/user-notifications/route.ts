import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // @ts-ignore
  const role: string = session.user.realRole || session.user.role || "";
  if (!["ADMIN", "SUPERADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, notifyOnReportSubmission } = await req.json();
  if (!userId || typeof notifyOnReportSubmission !== "boolean") {
    return NextResponse.json({ error: "userId and notifyOnReportSubmission required" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { notifyOnReportSubmission },
    select: { id: true, notifyOnReportSubmission: true },
  });

  return NextResponse.json(updated);
}
