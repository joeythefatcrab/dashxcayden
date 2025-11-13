import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore - role exists in our session
  if (session.user.role !== "PARENT") {
    redirect("/dashboard");
  }

  // Get parent's students
  const students = await db.student.findMany({
    where: { parentId: session.user.id },
    select: {
      id: true,
      name: true,
      grade: true,
    },
    orderBy: { name: "asc" },
  });

  // Get all curricula that students are enrolled in
  const enrollments = await db.enrollment.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
    },
    include: {
      curriculum: {
        select: {
          id: true,
          name: true,
          subject: true,
        },
      },
    },
  });

  const curricula = Array.from(
    new Map(
      enrollments.map((e) => [e.curriculum.id, e.curriculum])
    ).values()
  );

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Progress Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Generate and download detailed progress reports for your children
        </p>
      </div>

      <div className="space-y-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Export Progress Data</CardTitle>
            <CardDescription>
              Download comprehensive CSV reports for record-keeping, compliance, or sharing with supervisors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportGenerator students={students} curricula={curricula} />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <h4 className="font-medium">📊 Student Information</h4>
                <p className="text-sm text-muted-foreground">Name, grade level</p>
              </div>
              <div>
                <h4 className="font-medium">📚 Course Details</h4>
                <p className="text-sm text-muted-foreground">
                  Curriculum, units, lessons
                </p>
              </div>
              <div>
                <h4 className="font-medium">📈 Performance Data</h4>
                <p className="text-sm text-muted-foreground">
                  Scores, points earned, pass/fail
                </p>
              </div>
              <div>
                <h4 className="font-medium">🎯 Learning Objectives</h4>
                <p className="text-sm text-muted-foreground">
                  State standards covered
                </p>
              </div>
              <div>
                <h4 className="font-medium">📅 Timestamps</h4>
                <p className="text-sm text-muted-foreground">
                  Completion dates and times
                </p>
              </div>
              <div>
                <h4 className="font-medium">✅ Compliance Ready</h4>
                <p className="text-sm text-muted-foreground">
                  Format accepted by most districts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
