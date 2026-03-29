import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function getRole(session: any): string {
  return session?.user?.realRole || session?.user?.role || "";
}

type Params = { params: Promise<{ id: string }> };

// POST — add a course to the program
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: programId } = await params;
  const { curriculumId, isRequired } = await req.json();

  if (!curriculumId) return NextResponse.json({ error: "curriculumId required" }, { status: 400 });

  // Determine next order index
  const maxOrder = await db.programCourse.aggregate({
    where: { programId },
    _max: { order: true },
  });
  const order = (maxOrder._max.order ?? -1) + 1;

  const programCourse = await db.programCourse.create({
    data: { programId, curriculumId, order, isRequired: isRequired ?? true },
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
  });

  return NextResponse.json(programCourse, { status: 201 });
}

// PATCH — update a course (isRequired, or reorder all)
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: programId } = await params;
  const body = await req.json();

  // Reorder: body = { orderedIds: string[] }
  if (body.orderedIds) {
    await Promise.all(
      body.orderedIds.map((courseId: string, index: number) =>
        db.programCourse.update({
          where: { id: courseId },
          data: { order: index },
        })
      )
    );
    return NextResponse.json({ success: true });
  }

  // Update isRequired for a single course: body = { programCourseId, isRequired }
  if (body.programCourseId !== undefined) {
    const updated = await db.programCourse.update({
      where: { id: body.programCourseId },
      data: { isRequired: body.isRequired },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

// DELETE — remove a course from the program
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: programId } = await params;
  const { programCourseId } = await req.json();

  await db.programCourse.delete({ where: { id: programCourseId } });
  return NextResponse.json({ success: true });
}
