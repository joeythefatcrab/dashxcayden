import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ReportOverrideEditor } from "@/components/superadmin/ReportOverrideEditor";
import { AddHoursForm } from "@/components/superadmin/AddHoursForm";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function SuperadminReportsPage() {
  const session = await auth();
  // @ts-ignore
  const role = session?.user?.realRole || session?.user?.role;
  if (role !== "SUPERADMIN") redirect("/dashboard");

  const students = await db.student.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      parent: { select: { name: true } },
    },
  });

  const reports = await db.monthlyReport.findMany({
    where: { submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 50,
    select: {
      id: true,
      month: true,
      year: true,
      submittedAt: true,
      student: { select: { name: true } },
    },
  });

  // Fetch superadminOverride via raw SQL — column may not exist yet if migration hasn't run
  const overrideMap: Record<string, any> = {};
  try {
    const rows = await db.$queryRaw<{ id: string; superadminOverride: any }[]>`
      SELECT id, "superadminOverride" FROM "MonthlyReport"
      WHERE "submittedAt" IS NOT NULL
      ORDER BY "submittedAt" DESC LIMIT 50
    `;
    for (const row of rows) overrideMap[row.id] = row.superadminOverride ?? null;
  } catch { /* column not migrated yet — all overrides will show as null */ }

  const serialized = reports.map((r) => ({
    ...r,
    submittedAt: r.submittedAt!.toISOString(),
    superadminOverride: overrideMap[r.id] ?? null,
  }));

  const studentList = students.map((s) => ({ id: s.id, name: s.name, parentName: s.parent?.name ?? null }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
      </div>

      <AddHoursForm students={studentList} />

      <div>
        <h2 className="text-lg font-semibold mb-3">PDF Overrides</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste partial JSON to override fields in the PDF renderer for submitted reports.
        </p>
      </div>
      <div className="space-y-4">
        {serialized.map((report) => (
          <ReportOverrideEditor
            key={report.id}
            reportId={report.id}
            label={`${report.student.name} — ${MONTH_NAMES[report.month]} ${report.year}`}
            submittedAt={report.submittedAt}
            initialOverride={report.superadminOverride as Record<string, any> | null}
          />
        ))}
        {serialized.length === 0 && (
          <p className="text-sm text-muted-foreground">No submitted reports yet.</p>
        )}
      </div>
    </div>
  );
}
