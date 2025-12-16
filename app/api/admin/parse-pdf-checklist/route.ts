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

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const subject = formData.get("subject") as string;
    const saveToDatabase = formData.get("saveToDatabase") === "true";
    const curriculumDataStr = formData.get("curriculumData") as string;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let parsedCurriculum;
    let extractedText = "";

    // If curriculum data is provided, skip PDF parsing
    if (curriculumDataStr) {
      console.log("Using pre-parsed curriculum data");
      try {
        parsedCurriculum = JSON.parse(curriculumDataStr);
      } catch (parseError) {
        console.error("Failed to parse curriculum data:", parseError);
        throw new Error("Invalid curriculum data provided");
      }
    } else {
      // Parse PDF
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract text from PDF
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from PDF" },
          { status: 400 }
        );
      }

      console.log(`Extracted ${extractedText.length} characters from PDF (${pdfData.numpages} pages)`);

      // Use OpenAI Assistant to parse the PDF text into a structured checklist/curriculum
      const assistantId = "asst_R4hsz2dCZ3DwpaaITjaWCJHV";

      // Create a thread
      const thread = await openai.beta.threads.create();

      // Determine how much text to send (max ~500k characters for GPT-4 context window)
      const maxChars = 500000;
      const textToSend = extractedText.slice(0, maxChars);

      if (extractedText.length > maxChars) {
        console.warn(`PDF text truncated from ${extractedText.length} to ${maxChars} characters`);
      }

      // Add message with extracted text
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `CRITICAL INSTRUCTIONS - READ CAREFULLY:

Your ONLY job is to structure this document into a JSON checklist format. You MUST preserve the EXACT original text.

STRICT RULES:
1. Copy text VERBATIM - Do NOT rewrite, paraphrase, summarize, or improve
2. Use EXACT wording from the document for:
   - Item prompts (e.g., "READ: Data Sheet #10 Energy")
   - Lesson descriptions
   - Content (contentMd should be the exact original instructions)
   - Unit titles
3. Keep ALL numbering, references, codes (e.g., "DS #8948", "step B.11")
4. Preserve original formatting, capitalization, punctuation
5. If the doc says "DEMONSTRATE: Show work", use EXACTLY that text
6. If instructions reference external materials, keep those references intact
7. contentMd = the exact original text from that section, not a summary

OCR ERROR CORRECTION - YOU MAY FIX THESE:
✅ Fix obvious OCR typos: "tlie" → "the", "witli" → "with", "sliow" → "show"
✅ Fix character substitutions: "0" → "O", "1" → "l" when clearly wrong
✅ Fix spacing issues: "DataSheet" → "Data Sheet"
✅ Fix capitalization ONLY if clearly OCR errors: "RFAD" → "READ"
❌ Do NOT change actual words, terminology, or meaning
❌ Do NOT rewrite instructions in "better" language
❌ Do NOT modernize or simplify wording

ITEM TYPES - USE THESE EXACT VALUES:
- For checklist tasks/steps: type: "CHECKBOX"
- For multiple choice questions: type: "MCQ"
- For short written answers: type: "SHORT_ANSWER"
- For essay questions: type: "ESSAY"
- For true/false questions: type: "TRUE_FALSE"

NEVER use "task" or any other type - only use the exact values listed above.

Example of CORRECT behavior:
Original: "1. READ: Data Sheet (DS) #10 Energy. _________"
Your output: type: "CHECKBOX", prompt: "READ: Data Sheet (DS) #10 Energy"

Example of WRONG behavior:
Original: "1. READ: Data Sheet (DS) #10 Energy. _________"
Your output: prompt: "Read about energy concepts" ❌ WRONG - this is rewriting!

CRITICAL: Process the COMPLETE document from start to finish. Include EVERY unit, EVERY lesson, and EVERY item. Do not stop early - process all ${textToSend.length} characters of content.

Structure this ENTIRE curriculum document, preserving ALL original text exactly:

${textToSend}`,
      });

      // Run the assistant with JSON schema for structured output
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "curriculum_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                subject: { type: "string" },
                grade: { type: ["number", "null"] },
                units: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      order: { type: "number" },
                      lessons: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            contentMd: { type: "string" },
                            order: { type: "number" },
                            threshold: { type: "number" },
                            objectives: {
                              type: "array",
                              items: { type: "string" }
                            },
                            items: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  type: {
                                    type: "string",
                                    enum: ["CHECKBOX", "MCQ", "SHORT_ANSWER", "ESSAY", "TRUE_FALSE"]
                                  },
                                  prompt: { type: "string" },
                                  order: { type: "number" },
                                  points: { type: "number" },
                                  answerKey: { type: "string" }
                                },
                                required: ["type", "prompt", "order", "points", "answerKey"],
                                additionalProperties: false
                              }
                            }
                          },
                          required: ["title", "description", "contentMd", "order", "threshold", "objectives", "items"],
                          additionalProperties: false
                        }
                      }
                    },
                    required: ["title", "description", "order", "lessons"],
                    additionalProperties: false
                  }
                }
              },
              required: ["name", "description", "subject", "grade", "units"],
              additionalProperties: false
            }
          }
        }
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

      // Log response for debugging
      console.log("Assistant response:", responseText);

      // Strip markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }

      // Parse JSON response
      try {
        parsedCurriculum = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        console.error("Response text:", cleanedResponse);
        throw new Error(`Invalid JSON response from assistant: ${cleanedResponse.slice(0, 200)}`);
      }
    }

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
                      ...(item.choices && { choices: item.choices }),
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
  } catch (error: any) {
    console.error("Error parsing PDF:", error);

    // Handle OpenAI API errors specifically
    if (error?.status === 403 || error?.message?.includes("Forbidden")) {
      return NextResponse.json(
        {
          error: "OpenAI API access forbidden. Please verify your OPENAI_API_KEY has access to the Assistants API and the assistant ID is correct.",
          details: error.message
        },
        { status: 403 }
      );
    }

    if (error?.status === 404 && error?.message?.includes("assistant")) {
      return NextResponse.json(
        {
          error: "OpenAI Assistant not found. The assistant ID may be invalid or deleted.",
          details: error.message
        },
        { status: 404 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: errorMessage,
        stack: errorStack,
        step: "Check the error details above for more information"
      },
      { status: 500 }
    );
  }
}
