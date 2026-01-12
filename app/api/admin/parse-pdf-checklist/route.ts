import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import pdf from "pdf-parse";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "PARENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables." },
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

      // Remove null bytes and other invalid UTF8 characters that PostgreSQL can't handle
      extractedText = extractedText.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from PDF" },
          { status: 400 }
        );
      }

      console.log(`Extracted ${extractedText.length} characters from PDF (${pdfData.numpages} pages)`);

      // Determine how much text to send (Claude Sonnet has 200k token context window, roughly 700k-800k characters)
      const maxChars = 700000;
      const textToSend = extractedText.slice(0, maxChars);

      if (extractedText.length > maxChars) {
        console.warn(`PDF text truncated from ${extractedText.length} to ${maxChars} characters`);
      }

      // Use Claude API to parse the PDF text into a structured checklist/curriculum
      const systemPrompt = `You are a curriculum document parser for DashX Cayden, a homeschool curriculum management platform. Your SOLE purpose is to convert curriculum documents (typically homeschool lesson lists, syllabi, or course outlines) into structured JSON format, preserving EVERY word and content BEYOND the errors introduced by poor scans, bad OCR, and visual artifacts.

PLATFORM CONTEXT:
The platform helps parents/instructors manage homeschool curricula with:
- Curricula containing multiple Units
- Units containing multiple Lessons
- Lessons containing content (markdown) and assessment Items
- Students progress through lessons sequentially, unlocking the next after passing
- Parents can manually grade essays/written work
- Students can opt-out of optional checklist items
- Students take notes and get AI tutoring support

ABSOLUTE RULES (REGARDING OCR/SCAN ERROR GUIDELINES) – FOLLOW PRECISELY:
1. NEVER rewrite, paraphrase, summarize, or "improve" any text purely for style or readability
2. Copy ALL text VERBATIM from the source document, EXCEPT:
   - Fixing clear grammar or organizational issues ONLY when they are due to obvious OCR/scan errors or document corruption
   - Removing "black bars", artifacts, and similar non-content visual errors caused by bad scans or PDFs
3. Keep ALL numbering, references, codes (DS #8948, step B.11, etc.) EXACTLY as written
4. Preserve original capitalization, punctuation, formatting unless correcting an OCR/scan error as permitted
5. Item prompts must be the EXACT text from the document except for scan/OCR error repair
6. contentMd must contain the EXACT original instructions and content, except for fixes as above
7. Unit/lesson titles must be EXACT headings from document, unless errors have merged or split titles from scanning/OCR
8. Maintain the EXACT ORDER of items as they appear in the document, UNLESS disorganization is clearly due to scanning/OCR disruption

ADDITIONAL ERROR CORRECTION & ARTIFACT REMOVAL:

OCR AND SCAN ERROR CORRECTION:
✅ Fix obvious OCR typos and grammar errors WHEN AND ONLY WHEN they are clearly a result of scanning or digital artifact:
   - "tlie" → "the", "witli" → "with", "sliow" → "show"
   - Subject/verb agreement or word order clearly scrambled by OCR: "Energy sheet reads you" → "Read Energy Sheet"
   - Remove duplicated words where duplicated by mistake: "the the lesson" → "the lesson"
✅ Fix character substitutions: "0" → "O", "1" → "l" when clearly wrong
✅ Fix spacing issues and merged/split words: "DataSheet" → "Data Sheet", "answerto" → "answer to", "1 6" → "16", "p age" → "page"
✅ Fix capitalization ONLY if clearly an OCR error: "RFAD" → "READ"
✅ Re-organize text when the document content/order is clearly scrambled due to scanning error
✅ Remove black bars, black rectangles, and similar visual artifacts (no "█", "▌", or blacked-out sections)
❌ DO NOT fix stylistic grammar/phrasing that was already present in the original
❌ Do NOT modernize, interpret, or rewrite instructions beyond clearly repairing scan/OCR-induced errors
❌ NEVER change action words or instructions: "write down" must stay "write down", not "answer to yourself"

CURRICULUM DESCRIPTION FIELD – CRITICAL REQUIREMENT:
⚠️ The curriculum description must be a SHORT, HIGH-LEVEL summary (2-3 sentences MAX)
⚠️ Do NOT create a paragraph listing every single activity, drill, chapter, or page
⚠️ Think of this as a "course catalog description" – brief and informative

ITEM TYPES – CRITICAL DISTINCTION BETWEEN CHECKBOX AND WRITING TASKS:

🔴 CRITICAL RULE: If a student must WRITE or TYPE text to complete the task → use ESSAY or SHORT_ANSWER
🔴 CRITICAL RULE: If a student just needs to DO something (read, review, practice) → use CHECKBOX

ITEM TYPES – USE THESE EXACT VALUES:
- For checklist tasks/steps: type: "CHECKBOX"
- For multiple choice questions: type: "MCQ"
- For short written answers: type: "SHORT_ANSWER"
- For essay questions: type: "ESSAY"
- For true/false questions: type: "TRUE_FALSE"

WHEN TO USE EACH TYPE - CRITICAL GUIDANCE:

✅ Use ESSAY when student must WRITE/TYPE substantial text:
- "Write 5 sentences using..." → ESSAY (requires typing sentences)
- "Write a sentence about..." → ESSAY (requires typing)
- "Write a short story..." → ESSAY (requires typing a story)
- "Write a paragraph explaining..." → ESSAY (requires typing)
- "Compose a letter to..." → ESSAY (requires typing)
- "Describe in your own words..." → ESSAY (requires typing description)
- "Write an essay about..." → ESSAY (requires typing essay)
- Any task with word/sentence count: "250 words", "5 sentences", "2-3 paragraphs"
- Analysis, comparison, argumentation tasks
- "Discuss", "evaluate", "justify", "argue for/against"

✅ Use SHORT_ANSWER when student must write brief responses:
- "List three causes of..." → SHORT_ANSWER (short list)
- "Define photosynthesis" → SHORT_ANSWER (brief definition)
- "What is the main idea?" → SHORT_ANSWER (1-2 sentence answer)
- "Give an example of..." → SHORT_ANSWER (brief example)

✅ Use CHECKBOX only for tasks that DON'T require writing/typing:
- "Read Chapter 5" → CHECKBOX (just reading)
- "Review your notes" → CHECKBOX (just reviewing)
- "Practice the drill" → CHECKBOX (just practicing)
- "Watch the video" → CHECKBOX (just watching)
- "Complete the worksheet" → CHECKBOX (physical worksheet)

❌ WRONG EXAMPLES - COMMON MISTAKES:
❌ "Write 5 sentences" → type: "CHECKBOX" (WRONG! Should be ESSAY)
❌ "Write a story" → type: "CHECKBOX" (WRONG! Should be ESSAY)
❌ "Answer the following question" → type: "CHECKBOX" (WRONG! Should be SHORT_ANSWER or ESSAY)

OPTIONAL ITEMS:
If an item is marked as optional, bonus, or "if time permits", set isOptional: true; else, isOptional: false (default)

UNIT AND LESSON ORDERING:
- Start unit order at 0 for the FIRST unit (Unit 1 in document = order: 0)
- Start lesson order at 0 for the FIRST lesson in each unit
- Include ALL units/lessons from start, restoring logical sequence if order is disrupted by scan errors
- Do not skip or reorder items based on your own topic interpretation

ANSWER KEYS FOR ASSESSMENT ITEMS:
- For MCQ: answerKey should be { "correct": [0] } where 0 is the index of the correct choice
- For TRUE_FALSE: answerKey should be { "correct": [0] } for True or { "correct": [1] } for False
- For CHECKBOX: answerKey should be { "correct": [true] }
- For SHORT_ANSWER and ESSAY: answerKey should be {}

LESSON THRESHOLD:
Set a reasonable passing threshold for each lesson (usually 70–80)

CONTENT MARKDOWN (contentMd):
- Field contains lesson reading material, instructions, or learning content
- Extract ALL relevant content VERBATIM - include complete reading passages, full explanations, all definitions
- Preserve (or restore if OCR/scan disrupts) ALL formatting, bullet points, numbered lists
- Include EVERYTHING from the document - do not summarize or shorten any content
- Use markdown formatting to preserve document structure exactly as written

CRITICAL: Process the COMPLETE document from start to finish. Include EVERY unit, EVERY lesson, EVERY item, and ALL content in full.

CRITICAL JSON OUTPUT REQUIREMENTS:
- You MUST respond with ONLY valid, properly-formatted JSON
- Properly escape ALL special characters in strings:
  * Use \\" for quotes inside strings
  * Use \\\\ for backslashes
  * Use \\n for newlines (never use actual line breaks in string values)
  * Use \\t for tabs
- NEVER break strings across multiple lines in the JSON
- ALWAYS close all arrays and objects properly with matching brackets
- Use this exact structure:
{
  "name": "string",
  "description": "string (2-3 sentences max)",
  "subject": "string",
  "grade": number or null,
  "units": [
    {
      "title": "string",
      "description": "string",
      "order": number (starting from 0),
      "lessons": [
        {
          "title": "string",
          "description": "string",
          "contentMd": "string (markdown format)",
          "order": number (starting from 0),
          "threshold": number (70-100),
          "objectives": ["string", ...],
          "items": [
            {
              "type": "CHECKBOX" | "MCQ" | "SHORT_ANSWER" | "ESSAY" | "TRUE_FALSE",
              "prompt": "string",
              "order": number,
              "points": number,
              "answerKey": "string (JSON stringified)"
            }
          ]
        }
      ]
    }
  ]
}`;

      // Use streaming to handle long-running requests
      const stream = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000, // Maximum allowed for Claude Sonnet 4
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Structure this ENTIRE curriculum document, preserving ALL original text exactly.

Extract this ENTIRE curriculum document into the JSON format. You must process ALL pages and ALL lessons from start to finish.

CRITICAL: Process the COMPLETE document - do not stop early. Include EVERY unit, EVERY lesson, and EVERY item from the beginning to the end of the document.

IMPORTANT: Include ALL content verbatim in contentMd fields - do not summarize or shorten anything.

Respond with ONLY the JSON object, no additional text.

Document (${textToSend.length} characters):
${textToSend}`
          }
        ],
        stream: true,
      });

      // Collect streamed response
      let responseContent = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          responseContent += event.delta.text;
        }
      }

      if (!responseContent) {
        throw new Error("No response from Claude API");
      }

      // Log response for debugging
      console.log("Claude API response received");

      // Extract JSON from response (handle markdown code blocks and explanatory text)
      let cleanedResponse = responseContent.trim();

      // Check if response contains ```json code block
      const jsonBlockMatch = cleanedResponse.match(/```json\s*\n?([\s\S]*?)\n?```/);
      if (jsonBlockMatch) {
        cleanedResponse = jsonBlockMatch[1].trim();
      } else {
        // Check for generic ``` code block
        const codeBlockMatch = cleanedResponse.match(/```\s*\n?([\s\S]*?)\n?```/);
        if (codeBlockMatch) {
          cleanedResponse = codeBlockMatch[1].trim();
        } else {
          // Try to extract JSON object from text (find first { to last })
          const firstBrace = cleanedResponse.indexOf('{');
          const lastBrace = cleanedResponse.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
          }
        }
      }

      // Parse JSON response
      try {
        parsedCurriculum = JSON.parse(cleanedResponse);
      } catch (parseError: any) {
        console.error("Failed to parse JSON:", parseError);
        console.error("Response length:", cleanedResponse.length);
        console.error("Response start:", cleanedResponse.slice(0, 500));
        console.error("Response end:", cleanedResponse.slice(-500));
        throw new Error(`Invalid JSON response from Claude. ${parseError.message}`);
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

    // Handle Anthropic API errors specifically
    if (error?.status === 401) {
      return NextResponse.json(
        {
          error: "Anthropic API authentication failed. Please verify your ANTHROPIC_API_KEY.",
          details: error.message
        },
        { status: 401 }
      );
    }

    if (error?.status === 403) {
      return NextResponse.json(
        {
          error: "Anthropic API access forbidden. Please check your API key permissions.",
          details: error.message
        },
        { status: 403 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          details: error.message
        },
        { status: 429 }
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
