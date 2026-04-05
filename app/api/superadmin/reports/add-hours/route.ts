import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  // @ts-ignore
  const role = session?.user?.realRole || session?.user?.role;
  if (!session?.user || role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId, month, year, title, category, hours, description } = await req.json();

  if (!studentId || !month || !year || !title || !hours) {
    return NextResponse.json({ error: "studentId, month, year, title, hours required" }, { status: 400 });
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, parentId: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Find or create the monthly report draft
  const report = await db.monthlyReport.upsert({
    where: { studentId_month_year: { studentId, month, year } },
    create: { studentId, parentId: student.parentId, month, year },
    update: {},
    select: { id: true },
  });

  const activity = await db.externalActivity.create({
    data: {
      reportId: report.id,
      title,
      category: category || "Other",
      hoursSpent: parseFloat(hours),
      description: description || null,
      date: new Date(year, month - 1, 1),
      submittedBy: "admin",
    },
  });

  return NextResponse.json({ activity, reportId: report.id });
}
