import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MonthlyReportViewer } from "@/components/parent/MonthlyReportViewer";

export default async function MonthlyReportsPage() {
  const session = await auth();

  if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Get all students for this parent
  const whereClause =
    session.user.role === "ADMIN"
      ? {} // Admins see all students
      : { parentId: session.user.id };

  const students = await db.student.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      grade: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (students.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Monthly Reports</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive monthly progress reports for your students
          </p>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No students found. Add students to generate reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Monthly Reports</h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive monthly progress reports for your students
        </p>
      </div>

      <MonthlyReportViewer students={students} />
    </div>
  );
}
