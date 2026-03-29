import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentIdParam = searchParams.get("studentId");
  const programId = searchParams.get("programId");

  // If a specific studentId is requested (parent/admin viewing), verify access
  let studentId = studentIdParam;
  if (!studentId) {
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
    studentId = student.id;
  }

  // Find program (use specified or most recent enrollment)
  let resolvedProgramId = programId;
  if (!resolvedProgramId) {
    const enrollment = await db.programEnrollment.findFirst({
      where: { studentId },
      orderBy: { enrolledAt: "desc" },
      select: { programId: true },
    });
    if (!enrollment) return NextResponse.json(null);
    resolvedProgramId = enrollment.programId;
  }

  const program = await db.program.findUnique({
    where: { id: resolvedProgramId },
    include: {
      programCourses: {
        include: {
          curriculum: {
            include: {
              units: {
                include: {
                  lessons: {
                    select: { id: true, title: true, order: true, lessonType: true, isOffline: true },
                    orderBy: { order: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

  // Fetch enrollment progress for all courses
  const curriculumIds = program.programCourses.map((pc) => pc.curriculumId);
  const enrollments = await db.enrollment.findMany({
    where: { studentId, curriculumId: { in: curriculumIds } },
    select: { curriculumId: true, progress: true },
  });
  const progressMap = Object.fromEntries(enrollments.map((e) => [e.curriculumId, e.progress as any]));

  let totalLessons = 0;
  let totalCompleted = 0;

  const courses = program.programCourses.map((pc) => {
    const progress = progressMap[pc.curriculumId] || {};
    const units = pc.curriculum.units.map((unit) => {
      const lessons = unit.lessons.map((lesson) => {
        const done = !!progress[lesson.id]?.completed;
        if (done) totalCompleted++;
        totalLessons++;
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          lessonType: lesson.lessonType,
          isOffline: lesson.isOffline,
          completed: done,
          completedAt: progress[lesson.id]?.completedAt ?? null,
        };
      });
      const unitCompleted = lessons.filter((l) => l.completed).length;
      return { id: unit.id, title: unit.title, lessons, completedCount: unitCompleted, totalCount: lessons.length };
    });
    const courseCompleted = units.reduce((s, u) => s + u.completedCount, 0);
    const courseTotal = units.reduce((s, u) => s + u.totalCount, 0);
    return {
      curriculumId: pc.curriculumId,
      name: pc.curriculum.name,
      subject: pc.curriculum.subject,
      isRequired: pc.isRequired,
      order: pc.order,
      units,
      completedCount: courseCompleted,
      totalCount: courseTotal,
    };
  });

  return NextResponse.json({
    program: { id: program.id, name: program.name, academicYear: program.academicYear },
    studentId,
    totalLessons,
    totalCompleted,
    overallPct: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
    courses,
  });
}
