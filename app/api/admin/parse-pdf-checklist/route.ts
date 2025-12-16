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

    // Use OpenAI Assistant to parse the PDF text into a structured checklist/curriculum
    const assistantId = "asst_R4hsz2dCZ3DwpaaITjaWCJHV";

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add message with extracted text
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Convert this document into a structured curriculum checklist:\n\n${extractedText.slice(0, 15000)}`,
    });

    // Run the assistant with JSON response format
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      response_format: { type: "json_object" },
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (runStatus.status !== "completed") {
      if (runStatus.status === "failed" || runStatus.status === "cancelled" || runStatus.status === "expired") {
        throw new Error(`Assistant run ${runStatus.status}: ${runStatus.last_error?.message || "Unknown error"}`);
      }

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    if (!lastMessage || lastMessage.role !== "assistant") {
      throw new Error("No response from assistant");
    }

    // Extract text content
    const messageContent = lastMessage.content[0];
    if (messageContent.type !== "text") {
      throw new Error("Unexpected message content type");
    }

    const responseText = messageContent.text.value;

    // Parse JSON response
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
