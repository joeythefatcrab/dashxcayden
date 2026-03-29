import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function getRole(session: any): string {
  return session?.user?.realRole || session?.user?.role || "";
}

type Params = { params: Promise<{ id: string }> };

// POST — enroll a student in the program (also creates individual Enrollments per course)
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: programId } = await params;
  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  // Create program enrollment
  const programEnrollment = await db.programEnrollment.upsert({
    where: { programId_studentId: { programId, studentId } },
    create: { programId, studentId },
    update: {},
  });

  // Also enroll the student in each course in the program (if not already enrolled)
  const programCourses = await db.programCourse.findMany({ where: { programId } });
  for (const pc of programCourses) {
    await db.enrollment.upsert({
      where: { studentId_curriculumId: { studentId, curriculumId: pc.curriculumId } },
      create: { studentId, curriculumId: pc.curriculumId },
      update: {},
    });
  }

  return NextResponse.json(programEnrollment, { status: 201 });
}

// DELETE — unenroll a student from the program
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: programId } = await params;
  const { studentId } = await req.json();

  await db.programEnrollment.deleteMany({ where: { programId, studentId } });
  return NextResponse.json({ success: true });
}
