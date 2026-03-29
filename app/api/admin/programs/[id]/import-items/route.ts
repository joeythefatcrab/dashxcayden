import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const userRole: string = session.user.realRole || session.user.role || "";
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const program = await db.program.findUnique({ where: { id: programId } });
    if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 });

    const { items } = await req.json() as {
      items: Array<{
        tempId: string;
        title: string;
        description: string;
        type: string;
        hoursRequired?: number;
        selectedCurriculumId?: string;
        skip?: boolean;
      }>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Determine current max order for courses and activities
    const [maxCourseOrder, maxActivityOrder] = await Promise.all([
      db.programCourse.findFirst({ where: { programId }, orderBy: { order: "desc" }, select: { order: true } }),
      db.programActivity.findFirst({ where: { programId }, orderBy: { order: "desc" }, select: { order: true } }),
    ]);

    let courseOrder = (maxCourseOrder?.order ?? -1) + 1;
    let activityOrder = (maxActivityOrder?.order ?? -1) + 1;

    let coursesAdded = 0;
    let activitiesAdded = 0;
    let skipped = 0;

    for (const item of items) {
      if (item.skip) { skipped++; continue; }

      if (item.type === "COURSE" && item.selectedCurriculumId) {
        // Upsert: skip if already in program
        await db.programCourse.upsert({
          where: { programId_curriculumId: { programId, curriculumId: item.selectedCurriculumId } },
          update: {},
          create: {
            programId,
            curriculumId: item.selectedCurriculumId,
            order: courseOrder++,
            isRequired: true,
          },
        });
        coursesAdded++;
      } else if (item.type !== "COURSE") {
        await db.programActivity.create({
          data: {
            programId,
            title: item.title,
            description: item.description || null,
            activityType: item.type,
            hoursRequired: item.hoursRequired ?? null,
            order: activityOrder++,
          },
        });
        activitiesAdded++;
      } else {
        // COURSE type but no curriculum selected — skip
        skipped++;
      }
    }

    return NextResponse.json({ coursesAdded, activitiesAdded, skipped });
  } catch (error) {
    console.error("Import items error:", error);
    return NextResponse.json({ error: "Failed to import items" }, { status: 500 });
  }
}
