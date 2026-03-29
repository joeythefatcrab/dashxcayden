import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function getRole(session: any): string {
  return session?.user?.realRole || session?.user?.role || "";
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const programs = await db.program.findMany({
    include: {
      _count: { select: { programCourses: true, enrollments: true } },
    },
    orderBy: [{ academicYear: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(programs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(getRole(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, description, academicYear } = await req.json();
  if (!name || !academicYear) {
    return NextResponse.json({ error: "Name and academic year are required" }, { status: 400 });
  }

  const program = await db.program.create({
    data: { name, description: description || null, academicYear, createdById: session.user.id },
  });

  return NextResponse.json(program, { status: 201 });
}
