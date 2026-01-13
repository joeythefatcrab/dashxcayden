import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OpenAI from "openai";
import pdf from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to process a single chunk
async function processChunk(chunkText: string, chunkIndex: number, totalChunks: number) {
  const chunkPrompt = `Extract curriculum content from this section of a document (chunk ${chunkIndex + 1} of ${totalChunks}).

CRITICAL: Extract ALL units, lessons, and assessment items. Each lesson should have items (questions/tasks).

ITEM TYPES - Determine the correct type for each task:
- CHECKBOX: Simple tasks to complete (read, do, practice, show teacher, etc.)
- SHORT_ANSWER: Questions requiring brief written responses
- ESSAY: Questions requiring longer written responses or compositions
- MCQ: Multiple choice questions with options
- TRUE_FALSE: True/false questions

For CHECKBOX items:
- Use for action items: "READ lesson X", "DO practice problems", "SHOW your teacher", "CHECK your answers"
- answerKey: "{\"correct\": [true]}"

For answer keys:
- CHECKBOX: {"correct": [true]}
- MCQ: {"correct": [0]} (index of correct choice)
- TRUE_FALSE: {"correct": [0]} for True or {"correct": [1]} for False
- SHORT_ANSWER/ESSAY: {}

Return ONLY valid JSON with this structure:
{
  "units": [
    {
      "title": "string",
      "description": "string",
      "order": number,
      "lessons": [
        {
          "title": "string",
          "description": "string",
          "contentMd": "string",
          "order": number,
          "threshold": number,
          "objectives": ["string"],
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
}

Text to parse:
${chunkText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 16000, // Smaller limit for chunks
      messages: [
        { role: "user", content: chunkPrompt }
      ],
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      console.error(`Chunk ${chunkIndex + 1}: No response`);
      return null;
    }

    // Extract JSON
    let cleanedResponse = responseText.trim();
    const jsonBlockMatch = cleanedResponse.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      cleanedResponse = jsonBlockMatch[1].trim();
    } else {
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
      }
    }

    const parsed = JSON.parse(cleanedResponse);
    console.log(`Chunk ${chunkIndex + 1}: Extracted ${parsed.units?.length || 0} units`);
    return parsed;
  } catch (error) {
    console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
    return null;
  }
}

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

      // Remove null bytes and other invalid UTF8 characters that PostgreSQL can't handle
      extractedText = extractedText.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from PDF" },
          { status: 400 }
        );
      }

      console.log(`Extracted ${extractedText.length} characters from PDF (${pdfData.numpages} pages)`);

      // For large documents, use chunked processing to avoid timeouts
      const CHUNK_SIZE = 35000; // Process 35K characters at a time
      const CHUNKS_PER_REQUEST = 2; // Process 2 chunks per request to stay under timeout
      const needsChunking = extractedText.length > CHUNK_SIZE;

      if (needsChunking) {
        console.log(`Large document detected (${extractedText.length} chars). Using chunked processing...`);

        // Split into chunks
        const chunks: string[] = [];
        for (let i = 0; i < extractedText.length; i += CHUNK_SIZE) {
          chunks.push(extractedText.slice(i, i + CHUNK_SIZE));
        }

        console.log(`Split into ${chunks.length} chunks. Processing ${CHUNKS_PER_REQUEST} chunks per request.`);

        // Determine which chunks to process this request
        const startChunk = parseInt(formData.get("startChunk") as string || "0");
        const endChunk = Math.min(startChunk + CHUNKS_PER_REQUEST, chunks.length);

        console.log(`Processing chunks ${startChunk} to ${endChunk - 1}...`);

        // Process chunks for this batch
        const batchUnits: any[] = [];

        for (let i = startChunk; i < endChunk; i++) {
          const chunk = chunks[i];
          console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);

          const chunkResult = await processChunk(chunk, i, chunks.length);
          if (chunkResult && chunkResult.units) {
            batchUnits.push(...chunkResult.units);
          }
        }

        // Check if there are more chunks to process
        const hasMoreChunks = endChunk < chunks.length;

        if (hasMoreChunks) {
          // Return partial results and tell frontend to continue
          return NextResponse.json({
            success: true,
            partial: true,
            progress: {
              processedChunks: endChunk,
              totalChunks: chunks.length,
              nextStartChunk: endChunk,
            },
            units: batchUnits,
            message: `Processed chunks ${startChunk + 1}-${endChunk} of ${chunks.length}. Continue processing...`
          });
        }

        // All chunks processed - combine with any previously processed units
        const previousUnitsJson = formData.get("previousUnits") as string;
        const allUnits = previousUnitsJson ? JSON.parse(previousUnitsJson) : [];
        allUnits.push(...batchUnits);

        // Combine results and renumber everything globally to avoid conflicts
        let globalUnitOrder = 0;
        let globalLessonOrder = 0;

        for (const unit of allUnits) {
          // Renumber units
          unit.order = globalUnitOrder++;

          if (unit.lessons) {
            for (const lesson of unit.lessons) {
              // Renumber lessons globally across all units
              lesson.order = globalLessonOrder++;

              // Renumber items within each lesson
              if (lesson.items) {
                for (let i = 0; i < lesson.items.length; i++) {
                  lesson.items[i].order = i;
                }
              }
            }
          }
        }

        parsedCurriculum = {
          name: name,
          description: description || "Curriculum parsed from PDF",
          subject: subject || "General",
          grade: null,
          units: allUnits
        };

        console.log(`Chunked processing complete. Total units: ${allUnits.length}, Total lessons: ${globalLessonOrder}`);
      } else {
        // Original single-request processing for small documents
        const textToSend = extractedText;
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
- Extract ALL essential instructional content: complete task descriptions, key instructions, learning objectives
- Include important reading passages and definitions that are central to understanding the lesson
- Be thorough but efficient: avoid repeating lengthy boilerplate or overly verbose passages
- Preserve formatting, bullet points, numbered lists for clarity
- Balance completeness with conciseness to stay within processing time limits

CRITICAL: Process the COMPLETE document from start to finish. Include EVERY unit, EVERY lesson, and EVERY item.

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

      // Use streaming with GPT-5 mini for fast, efficient parsing
      const stream = await openai.chat.completions.create({
        model: "gpt-5-mini", // GPT-5 mini model
        max_completion_tokens: 64000, // Large enough for complete curricula
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Structure this ENTIRE curriculum document efficiently.

Extract this ENTIRE curriculum document into the JSON format. You must process ALL pages and ALL lessons from start to finish.

CRITICAL: Process the COMPLETE document - do not stop early. Include EVERY unit, EVERY lesson, and EVERY item from the beginning to the end of the document.

IMPORTANT: Include all essential instructional content in contentMd fields. Be thorough but efficient to complete within time constraints.

Respond with ONLY the JSON object, no additional text.

Document (${textToSend.length} characters):
${textToSend}`
          }
        ],
        stream: true,
      });

      // Collect streamed response
      let responseContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          responseContent += content;
        }
      }

      if (!responseContent) {
        throw new Error("No response from OpenAI API");
      }

      // Log response for debugging
      console.log("OpenAI API response received");

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
        throw new Error(`Invalid JSON response from OpenAI. ${parseError.message}`);
      }
      } // End of else block for small documents
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
    if (error?.status === 401) {
      return NextResponse.json(
        {
          error: "OpenAI API authentication failed. Please verify your OPENAI_API_KEY.",
          details: error.message
        },
        { status: 401 }
      );
    }

    if (error?.status === 403) {
      return NextResponse.json(
        {
          error: "OpenAI API access forbidden. Please check your API key permissions.",
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
