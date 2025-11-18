import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCSV } from "@/lib/parsers/csv-parser";
import { generateCourseCode } from "@/lib/utils/course-code";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user || !["PARENT", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, fileName, name, description, subject } = body;

    if (!fileUrl || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine file type and parse
    let parsedData;
    const fileExtension = fileName.toLowerCase().split(".").pop();

    if (fileExtension === "csv") {
      parsedData = await parseCSV(fileUrl);
    } else {
      // For PDF/DOCX, return a message for now
      // We'll implement these parsers next
      return NextResponse.json(
        { error: "PDF and DOCX parsing coming soon. Use CSV for now." },
        { status: 400 }
      );
    }

    // Generate unique course code
    let courseCode: string;
    let isUnique = false;
    while (!isUnique) {
      courseCode = generateCourseCode();
      const existing = await db.curriculum.findUnique({
        where: { courseCode },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Save to database
    const curriculum = await db.curriculum.create({
      data: {
        name: name || parsedData.name,
        description: description || parsedData.description,
        subject,
        courseCode: courseCode!,
        isPublic: true, // Default to public
        createdById: session.user.id,
        rawFileUrl: fileUrl,
        rawData: parsedData as any,
        units: {
          create: parsedData.units.map((unit) => ({
            title: unit.title,
            description: unit.description,
            order: unit.order,
            lessons: {
              create: unit.lessons.map((lesson) => ({
                title: lesson.title,
                description: lesson.description,
                contentMd: lesson.contentMd,
                order: lesson.order,
                threshold: lesson.threshold || 70,
                objectives: lesson.objectives || [],
                items: {
                  create: lesson.items.map((item) => ({
                    type: item.type,
                    prompt: item.prompt,
                    order: item.order,
                    choices: item.choices ?? undefined,
                    answerKey: item.answerKey,
                    points: item.points || 1,
                  })),
                },
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      curriculumId: curriculum.id,
      courseCode: curriculum.courseCode,
      message: "Curriculum imported successfully",
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import curriculum" },
      { status: 500 }
    );
  }
}
