import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";
import pdf from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const subject = formData.get("subject") as string;
    const saveToDatabase = formData.get("saveToDatabase") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    // Use OpenAI to parse the PDF text into a structured checklist/curriculum
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert curriculum designer. Convert the provided document text into a structured curriculum with units and lessons.

Each lesson should be a checklist item or step from the document.

Return a JSON object with this exact structure:
{
  "name": "Curriculum name",
  "description": "Brief description",
  "subject": "Subject area",
  "grade": null,
  "units": [
    {
      "title": "Unit title",
      "description": "Unit description",
      "order": 1,
      "lessons": [
        {
          "title": "Lesson/Step title",
          "description": "What this step involves",
          "contentMd": "Detailed markdown content explaining this step",
          "order": 1,
          "threshold": 100,
          "objectives": ["Objective 1", "Objective 2"],
          "items": [
            {
              "type": "CHECKBOX",
              "prompt": "Checklist item text",
              "order": 1,
              "points": 1,
              "answerKey": "complete"
            }
          ]
        }
      ]
    }
  ]
}

Important:
- Create logical groupings as units
- Each step/task becomes a lesson with a checkbox item
- Use CHECKBOX type for all items (checklist format)
- Keep titles concise but descriptive
- Include helpful details in contentMd
- Order lessons sequentially`,
        },
        {
          role: "user",
          content: `Convert this document into a structured curriculum checklist:\n\n${extractedText.slice(0, 15000)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const parsedCurriculum = JSON.parse(responseText);

    // Override with user-provided values
    parsedCurriculum.name = name;
    if (description) parsedCurriculum.description = description;
    if (subject) parsedCurriculum.subject = subject;

    // If saveToDatabase is true, save to database
    if (saveToDatabase) {
      const curriculum = await db.curriculum.create({
        data: {
          name: parsedCurriculum.name,
          description: parsedCurriculum.description,
          subject: parsedCurriculum.subject,
          grade: parsedCurriculum.grade,
          isPublic: true,
          createdById: session.user.id,
          rawData: { source: "pdf-upload", extractedText: extractedText.slice(0, 5000) },
          units: {
            create: parsedCurriculum.units.map((unit: any) => ({
              title: unit.title,
              description: unit.description,
              order: unit.order,
              lessons: {
                create: unit.lessons.map((lesson: any) => ({
                  title: lesson.title,
                  description: lesson.description,
                  contentMd: lesson.contentMd,
                  order: lesson.order,
                  threshold: lesson.threshold || 100,
                  objectives: lesson.objectives || [],
                  items: {
                    create: lesson.items.map((item: any) => ({
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
        curriculum: parsedCurriculum,
        curriculumId: curriculum.id,
        message: "PDF parsed and checklist saved successfully",
      });
    }

    // Otherwise just return the parsed curriculum
    return NextResponse.json({
      success: true,
      curriculum: parsedCurriculum,
      message: "PDF parsed successfully",
    });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
