import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the student profile
  const student = await db.student.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { parent: { email: session.user.email ?? "" } },
      ],
    },
    select: { id: true },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Find active program enrollment
  const programEnrollment = await db.programEnrollment.findFirst({
    where: { studentId: student.id },
    include: {
      program: {
        include: {
          programCourses: {
            include: {
              curriculum: {
                include: {
                  units: {
                    include: { lessons: { orderBy: { order: "asc" } } },
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (!programEnrollment) return NextResponse.json(null);

  // Fetch enrollment progress for each course
  const curriculumIds = programEnrollment.program.programCourses.map((pc) => pc.curriculumId);
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id, curriculumId: { in: curriculumIds } },
    select: { curriculumId: true, progress: true },
  });
  const progressMap = Object.fromEntries(enrollments.map((e) => [e.curriculumId, e.progress as any]));

  // Build per-course stats
  let totalLessons = 0;
  let totalCompleted = 0;

  const courses = programEnrollment.program.programCourses.map((pc) => {
    const allLessonIds = pc.curriculum.units.flatMap((u) => u.lessons.map((l) => l.id));
    const progress = progressMap[pc.curriculumId] || {};
    const completed = allLessonIds.filter((id) => progress[id]?.completed).length;
    totalLessons += allLessonIds.length;
    totalCompleted += completed;

    return {
      programCourseId: pc.id,
      curriculumId: pc.curriculumId,
      name: pc.curriculum.name,
      subject: pc.curriculum.subject,
      isRequired: pc.isRequired,
      order: pc.order,
      totalLessons: allLessonIds.length,
      completedLessons: completed,
      progressPct: allLessonIds.length > 0 ? Math.round((completed / allLessonIds.length) * 100) : 0,
      units: pc.curriculum.units.map((u) => ({
        id: u.id,
        title: u.title,
        lessons: u.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          order: l.order,
          lessonType: l.lessonType,
          isOffline: l.isOffline,
          completed: !!progress[l.id]?.completed,
          completedAt: progress[l.id]?.completedAt ?? null,
        })),
      })),
    };
  });

  // Find next incomplete lesson across all courses (in order)
  let nextLesson: { curriculumId: string; lessonId: string; lessonTitle: string; courseName: string } | null = null;
  outer: for (const course of courses) {
    const progress = progressMap[course.curriculumId] || {};
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        if (!progress[lesson.id]?.completed) {
          // Check it's unlocked (first lesson always unlocked, others check progress)
          if (lesson.order === 0 || progress[lesson.id]?.unlocked !== false) {
            nextLesson = {
              curriculumId: course.curriculumId,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              courseName: course.name,
            };
            break outer;
          }
        }
      }
    }
  }

  return NextResponse.json({
    programEnrollmentId: programEnrollment.id,
    program: {
      id: programEnrollment.program.id,
      name: programEnrollment.program.name,
      academicYear: programEnrollment.program.academicYear,
      description: programEnrollment.program.description,
    },
    studentId: student.id,
    totalLessons,
    totalCompleted,
    overallPct: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
    courses,
    nextLesson,
    completedAt: programEnrollment.completedAt,
  });
}
