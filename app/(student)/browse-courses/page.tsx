import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CourseCatalog } from "@/components/student/CourseCatalog";

export default async function BrowseCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Get student profile
  const student = await db.student.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!student) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">No Student Profile</h2>
          <p className="mt-2 text-muted-foreground">
            Unable to find your student profile. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Get all public curricula (isPublic = true)
  const allCurricula = await db.curriculum.findMany({
    where: {
      isPublic: true,
    },
    include: {
      units: {
        include: {
          lessons: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get student's existing enrollments
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id },
    select: { curriculumId: true },
  });

  const enrolledCurriculumIds = enrollments.map((e) => e.curriculumId);

  // Filter out already enrolled courses
  const availableCurricula = allCurricula.filter(
    (c) => !enrolledCurriculumIds.includes(c.id)
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Browse Courses</h1>
        <p className="text-muted-foreground">
          Discover and enroll in courses to start learning
        </p>
      </div>

      <CourseCatalog
        availableCurricula={availableCurricula}
        studentId={student.id}
      />
    </div>
  );
}
