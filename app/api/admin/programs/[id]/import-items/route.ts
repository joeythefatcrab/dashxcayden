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

    const { sections } = await req.json() as {
      sections: Array<{
        title: string;
        items: Array<{
          tempId: string;
          sectionTitle: string;
          title: string;
          description: string;
          itemType: "CHECKBOX" | "ESSAY" | "COURSE_LINK";
          isOptional: boolean;
          requiresReview: boolean;
          selectedCurriculumId?: string;
          skip?: boolean;
        }>;
      }>;
    };

    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ error: "No sections provided" }, { status: 400 });
    }

    const maxOrder = await db.programChecklistItem.findFirst({
      where: { programId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let order = (maxOrder?.order ?? -1) + 1;

    const maxCourseOrder = await db.programCourse.findFirst({
      where: { programId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    let courseOrder = (maxCourseOrder?.order ?? -1) + 1;

    let checklistAdded = 0;
    let coursesAdded = 0;
    let skipped = 0;

    for (const section of sections) {
      for (const item of section.items) {
        if (item.skip) { skipped++; continue; }

        // Every non-skipped item becomes a checklist item
        await db.programChecklistItem.create({
          data: {
            programId,
            sectionTitle: section.title,
            title: item.title,
            description: item.description || null,
            itemType: item.itemType,
            curriculumId: item.itemType === "COURSE_LINK" && item.selectedCurriculumId
              ? item.selectedCurriculumId
              : null,
            isOptional: item.isOptional,
            requiresReview: item.requiresReview,
            order: order++,
          },
        });
        checklistAdded++;

        // COURSE_LINK items with a matched curriculum also become a ProgramCourse
        if (item.itemType === "COURSE_LINK" && item.selectedCurriculumId) {
          await db.programCourse.upsert({
            where: {
              programId_curriculumId: {
                programId,
                curriculumId: item.selectedCurriculumId,
              },
            },
            update: {},
            create: {
              programId,
              curriculumId: item.selectedCurriculumId,
              order: courseOrder++,
              isRequired: !item.isOptional,
            },
          });
          coursesAdded++;
        }
      }
    }

    return NextResponse.json({ checklistAdded, coursesAdded, skipped });
  } catch (error) {
    console.error("Import items error:", error);
    return NextResponse.json({ error: "Failed to import items" }, { status: 500 });
  }
}
