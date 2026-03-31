import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProgramChecklist } from "@/components/student/ProgramChecklist";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProgramChecklistPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; programId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { studentId, programId } = await searchParams;

  // Resolve studentId for logged-in student (if not provided via searchParams)
  let resolvedStudentId = studentId;
  if (!resolvedStudentId) {
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    resolvedStudentId = student?.id;
  }

  // Resolve programId from student's latest enrollment (if not provided)
  let resolvedProgramId = programId;
  if (!resolvedProgramId && resolvedStudentId) {
    const enrollment = await db.programEnrollment.findFirst({
      where: { studentId: resolvedStudentId },
      orderBy: { enrolledAt: "desc" },
      select: { programId: true },
    });
    resolvedProgramId = enrollment?.programId;
  }

  if (!resolvedStudentId || !resolvedProgramId) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        <p className="text-lg font-medium">No program found.</p>
        <p className="text-sm mt-1">You haven't been enrolled in a program yet.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/my-program">← Back to Program</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/my-program">
        <Button variant="ghost" size="sm" className="mb-6 print:hidden">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Program
        </Button>
      </Link>
      <ProgramChecklist studentId={resolvedStudentId} programId={resolvedProgramId} />
    </div>
  );
}
