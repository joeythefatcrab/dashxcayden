import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function getRole(session: any): string {
  return session?.user?.realRole || session?.user?.role || "";
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const program = await db.program.findUnique({
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
        include: {
          student: { select: { id: true, name: true, grade: true } },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(program);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { name, description, academicYear, isActive } = await req.json();

  const program = await db.program.update({
    where: { id },
    data: { name, description, academicYear, isActive },
  });

  return NextResponse.json(program);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await db.program.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
