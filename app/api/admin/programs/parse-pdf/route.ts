import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key" });

export type ParsedChecklistItem = {
  tempId: string;
  sectionTitle: string;
  title: string;
  description: string;
  itemType: "CHECKBOX" | "ESSAY" | "COURSE_LINK";
  isOptional: boolean;
  requiresReview: boolean;
  suggestedCourseName?: string;
  // populated after DB fuzzy match
  suggestedCurriculumId?: string;
  suggestedCurriculumName?: string;
  // set by admin during review
  selectedCurriculumId?: string;
  skip?: boolean;
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // @ts-ignore
    const userRole: string = session.user.realRole || session.user.role || "";
    if (userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text.trim();

    if (!rawText || rawText.length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. Is it a scanned image?" },
        { status: 422 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a homeschool yearly program document parser. Parse a checklist-style program document and extract every section and item.

Return JSON: { "sections": [ { "title": string, "items": [...] } ] }

Each item object:
{
  "title": string,           // clean text, no underscores or blank markers
  "description": string,     // brief description, empty string if none
  "itemType": string,        // see rules below
  "isOptional": boolean,
  "requiresReview": boolean,
  "suggestedCourseName": string | null  // only for COURSE_LINK items
}

itemType rules (pick exactly one):
- "COURSE_LINK" — item says the student "completed the X course" or "completed X" where X is a named course/curriculum
- "ESSAY"       — item says student "submitted essay", "submitted paper", "submitted write-up", "submitted report", "submitted final", "submitted documentation", or "wrote X"
- "CHECKBOX"    — everything else (read, watched, did, practiced, played, enjoyed, etc.)

requiresReview:
- true  when itemType is ESSAY (admin needs to receive and review the submission)
- false otherwise

isOptional:
- true if the item text contains "(Optional)" or the item is marked as optional in any way

suggestedCourseName:
- For COURSE_LINK items, extract the course/curriculum name (e.g. "Basic Study Manual", "Grammar and Communication")
- null for all other types

Parse every item you see — do not skip or merge items. Preserve the document's section structure.`,
        },
        {
          role: "user",
          content: `Parse this homeschool program document:\n\n${rawText.slice(0, 12000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content || '{"sections":[]}'
    );
    const sections: Array<{ title: string; items: any[] }> = parsed.sections || [];

    if (sections.length === 0 || sections.every((s) => s.items.length === 0)) {
      return NextResponse.json(
        { error: "No program items could be extracted from this PDF." },
        { status: 422 }
      );
    }

    // Fetch all curricula for fuzzy matching COURSE_LINK items
    const curricula = await db.curriculum.findMany({
      select: { id: true, name: true, subject: true },
      orderBy: [{ subject: "asc" }, { name: "asc" }],
    });

    function bestMatch(title: string) {
      const t = title.toLowerCase();
      return (
        curricula.find((c) => c.name.toLowerCase() === t || c.subject?.toLowerCase() === t) ??
        curricula.find(
          (c) =>
            c.name.toLowerCase().includes(t) ||
            t.includes(c.name.toLowerCase()) ||
            (c.subject &&
              (c.subject.toLowerCase().includes(t) || t.includes(c.subject.toLowerCase())))
        ) ??
        null
      );
    }

    let idx = 0;
    const enrichedSections = sections.map((section) => ({
      title: section.title,
      items: section.items.map((item: any): ParsedChecklistItem => {
        const isCourse = item.itemType === "COURSE_LINK";
        const matchName = item.suggestedCourseName || item.title;
        const match = isCourse ? bestMatch(matchName) : null;
        return {
          tempId: `item-${idx++}`,
          sectionTitle: section.title,
          title: item.title,
          description: item.description || "",
          itemType: item.itemType || "CHECKBOX",
          isOptional: item.isOptional === true,
          requiresReview: item.requiresReview === true,
          suggestedCourseName: item.suggestedCourseName ?? undefined,
          suggestedCurriculumId: match?.id,
          suggestedCurriculumName: match?.name,
          selectedCurriculumId: match?.id || "",
        };
      }),
    }));

    return NextResponse.json({
      sections: enrichedSections,
      curricula: curricula.map((c) => ({ id: c.id, name: c.name, subject: c.subject })),
      pageCount: pdfData.numpages,
    });
  } catch (error: any) {
    console.error("PDF parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse PDF: " + (error?.message || "unknown error") },
      { status: 500 }
    );
  }
}
