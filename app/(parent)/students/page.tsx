import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StudentManager } from "@/components/parent/StudentManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentsPage() {
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
    include: {
      user: {
        select: {
          email: true,
        },
      },
      enrollments: {
        include: {
          curriculum: {
            select: {
              id: true,
              name: true,
              subject: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get curricula this parent has access to
  // 1. Curricula they created themselves
  // 2. Curricula explicitly granted by admin
  const parentAccessRecords = await db.parentCurriculumAccess.findMany({
    where: { parentId: session.user.id },
    select: { curriculumId: true },
  });

  const accessibleCurriculumIds = parentAccessRecords.map((record) => record.curriculumId);

  const curricula = await db.curriculum.findMany({
    where: {
      OR: [
        { createdById: session.user.id },
        { id: { in: accessibleCurriculumIds } },
      ],
    },
    select: {
      id: true,
      name: true,
      subject: true,
      grade: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Students</h1>
        <p className="text-muted-foreground">
          Create student accounts and enroll them in courses
        </p>
      </div>

      <StudentManager
        students={students}
        curricula={curricula}
      />
    </div>
  );
}
