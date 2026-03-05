import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Toggle per-student paywall exemption
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await auth();
  // @ts-ignore
  const userRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || userRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await params;
  const { exempt } = await req.json();

  const student = await db.student.update({
    where: { id: studentId },
    data: { paywallExempt: exempt },
    select: { id: true, name: true, paywallExempt: true },
  });

  return NextResponse.json(student);
}
