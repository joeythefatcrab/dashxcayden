import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProgramEditor } from "@/components/admin/ProgramEditor";
import { ProgramPDFImport } from "@/components/admin/ProgramPDFImport";
import { ChecklistReviewPanel } from "@/components/admin/ChecklistReviewPanel";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  // @ts-ignore
  const userRole: string = session?.user?.realRole || session?.user?.role || "";
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) redirect("/dashboard");

  const [program, allCurricula, allStudents] = await Promise.all([
    db.program.findUnique({
      where: { id },
      include: {
        programCourses: {
          include: {
            curriculum: {
              include: {
                units: {
                  include: { lessons: { select: { id: true } } },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        enrollments: {
          include: { student: { select: { id: true, name: true, grade: true } } },
          orderBy: { enrolledAt: "desc" },
        },
      },
    }),
    db.curriculum.findMany({
      select: { id: true, name: true, subject: true, grade: true },
      orderBy: [{ subject: "asc" }, { name: "asc" }],
    }),
    db.student.findMany({
      select: { id: true, name: true, grade: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!program) notFound();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ProgramEditor
        program={JSON.parse(JSON.stringify(program))}
        allCurricula={allCurricula}
        allStudents={allStudents}
      />
      <ProgramPDFImport programId={id} />
      <ChecklistReviewPanel programId={id} />
    </div>
  );
}
