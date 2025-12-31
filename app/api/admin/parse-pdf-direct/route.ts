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

      // Determine how much text to send (max ~500k characters for GPT-4 context window)
      const maxChars = 500000;
      const textToSend = extractedText.slice(0, maxChars);

      if (extractedText.length > maxChars) {
        console.warn(`PDF text truncated from ${extractedText.length} to ${maxChars} characters`);
      }

      // Use direct GPT-4 API call with strict JSON schema
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: `You are a curriculum document parser. Your SOLE purpose is to convert curriculum documents into structured JSON format while preserving EVERY word exactly as written in the source.

ABSOLUTE RULES - FOLLOW THESE PRECISELY:
1. NEVER rewrite, paraphrase, summarize, or "improve" any text
2. Copy ALL text VERBATIM from the source document
3. Keep ALL numbering, references, codes (DS #8948, step B.11, etc.) EXACTLY as written
4. Preserve original capitalization, punctuation, formatting
5. Item prompts must be the EXACT text from the document
6. contentMd must contain the EXACT original instructions
7. Unit/lesson titles must be EXACT headings from document
8. Maintain the EXACT ORDER of items as they appear in the document

OCR ERROR CORRECTION - YOU MAY FIX THESE:
✅ Fix obvious OCR typos: "tlie" → "the", "witli" → "with", "sliow" → "show"
✅ Fix character substitutions: "0" → "O", "1" → "l" when clearly wrong
✅ Fix spacing issues: "DataSheet" → "Data Sheet", "answerto" → "answer to"
✅ Fix merged words: "readthe" → "read the", "writeyour" → "write your"
✅ Fix split numbers: "1 6" → "16", "p age" → "page"
✅ Fix capitalization ONLY if clearly OCR errors: "RFAD" → "READ"
❌ Do NOT change actual words, terminology, or meaning
❌ Do NOT rewrite instructions in "better" language
❌ Do NOT modernize or simplify wording
❌ NEVER change action words: "write down" must stay "write down", not "answer to yourself"

DESCRIPTION FIELD - CRITICAL REQUIREMENT:
⚠️ The description must be a SHORT, HIGH-LEVEL summary (2-3 sentences MAX)
⚠️ Do NOT create a paragraph listing every single activity, drill, chapter, or page
⚠️ Think of this as a "course catalog description" - brief and informative

✅ GOOD EXAMPLES:
- "This history curriculum covers American history from colonial times through the Civil War. Students will read primary sources, complete analytical exercises, and write short essays."
- "A comprehensive math course covering algebra fundamentals including equations, functions, and graphing. Includes practice problems and real-world applications."

❌ BAD EXAMPLES (DO NOT DO THIS):
- "Read chapter 1, answer questions 1-5 on page 7, complete drill #8948, read chapter 2 section A, answer questions on page 12, complete activity B.11..." (This is listing individual tasks)
- "Students will complete Reading Assignment #1, Data Sheet DS #8948, write down answers to questions..." (This is too detailed)

The description should NEVER be a to-do list of activities. Save the detailed instructions for the individual lesson contentMd fields.

ITEM TYPES - USE THESE EXACT VALUES:
- For checklist tasks/steps: type: "CHECKBOX"
- For multiple choice questions: type: "MCQ"
- For short written answers (1-2 sentences): type: "SHORT_ANSWER"
- For essay questions (detailed writing): type: "ESSAY"
- For true/false questions: type: "TRUE_FALSE"

WHEN TO USE ESSAY TYPE - CRITICAL DETECTION RULES:
Use type: "ESSAY" when the prompt includes ANY of these indicators:
✅ Contains words: "essay", "write a...", "compose", "explain in detail", "analyze", "describe in your own words"
✅ Requests multiple paragraphs or extended writing
✅ Asks for analysis, comparison, or argumentation
✅ Specifies word count (e.g., "250 words", "2-3 pages", "500 word essay")
✅ Asks to "discuss", "evaluate", "justify", "argue for/against"
✅ Phrases like "in a well-developed essay", "support your answer with examples"
✅ Creative writing prompts: "write a story", "write a letter", "write a narrative"

EXAMPLES OF ESSAY ITEMS:
✅ "Write a 250-word essay explaining the causes of the Civil War"
✅ "Describe in detail how photosynthesis works"
✅ "Write a narrative about a time you overcame a challenge"
✅ "Analyze the main themes in this chapter and support with examples"
✅ "Compose a persuasive essay arguing for or against school uniforms"

EXAMPLES OF SHORT_ANSWER (NOT ESSAY):
✅ "List three causes of World War I"
✅ "Define photosynthesis"
✅ "What is the main idea of this passage?"
✅ "Explain in 1-2 sentences why..."

NEVER use "task" or any other type - only use the exact values listed above.

UNIT AND LESSON ORDERING - CRITICAL:
- Start unit order at 0 for the FIRST unit (Unit 1 in document = order: 0)
- Start lesson order at 0 for the FIRST lesson in each unit
- Include ALL units starting from Unit 1 - do not skip the first unit
- If you see "Unit 1", "Unit I", or the first major section, it should have order: 0
- Process units and lessons in sequential order from the document
- MAINTAIN THE EXACT ORDER OF ITEMS as they appear on each page
- If page 7 says "answer questions" then "keep reading", preserve that exact order
- Do not reorder items based on your interpretation

EXAMPLES:
❌ WRONG: "answer the biology practice questions on page 7 to yourself"
✅ CORRECT: "answer the biology practice questions on page 7" (preserve exact wording)

❌ WRONG: "Read about energy concepts"
✅ CORRECT: "READ: Data Sheet (DS) #10 Energy"

Your job is ONLY to organize existing text into the JSON structure. Do NOT create ANY new content.`
          },
          {
            role: "user",
            content: `Extract this ENTIRE curriculum document into the JSON format. You must process ALL pages and ALL lessons from start to finish.

CRITICAL: Process the COMPLETE document - do not stop early. Include EVERY unit, EVERY lesson, and EVERY item from the beginning to the end of the document.

Remember: use EXACT text from the document, do NOT rewrite anything.

Document (${textToSend.length} characters):
${textToSend}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "curriculum_schema",
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

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error("No response from AI");
      }

      console.log("AI response received, parsing JSON...");
      parsedCurriculum = JSON.parse(responseContent);
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
          description: parsedCurriculum.description || "",
          subject: parsedCurriculum.subject || "General",
          grade: parsedCurriculum.grade,
          isPublic: true,
          createdById: session.user.id,
          rawData: {
            source: "pdf-upload",
            extractedText: extractedText,
          },
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
          error: "OpenAI API access forbidden. Please verify your OPENAI_API_KEY.",
          details: error.message
        },
        { status: 403 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: errorMessage,
        stack: errorStack,
      },
      { status: 500 }
    );
  }
}
