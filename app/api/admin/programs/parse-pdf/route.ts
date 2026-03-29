import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key" });

export type ParsedProgramItem = {
  tempId: string;
  rawTitle: string;
  title: string;
  description: string;
  type: "COURSE" | "VOLUNTEERING" | "FIELD_TRIP" | "PRACTICAL" | "READING" | "PE" | "OTHER";
  hoursRequired?: number;
  // populated by DB fuzzy match
  suggestedCurriculumId?: string;
  suggestedCurriculumName?: string;
  // set by admin in review UI
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

    // Parse PDF text
    const buffer = Buffer.from(await file.arrayBuffer());
    // Dynamic import to avoid edge-runtime issues
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text.trim();

    if (!rawText || rawText.length < 20) {
      return NextResponse.json({ error: "Could not extract text from PDF. Is it a scanned image?" }, { status: 422 });
    }

    // GPT extracts structured items from the program doc
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a homeschool curriculum document parser.
Extract all academic courses, activity requirements, and electives from a yearly homeschool program document.
Return a JSON object with an "items" array. Each item must have:
- title: string (clean, human-readable course/activity name)
- description: string (1-2 sentence description of what it involves; empty string if none)
- type: one of "COURSE" | "VOLUNTEERING" | "FIELD_TRIP" | "PRACTICAL" | "READING" | "PE" | "OTHER"
  - COURSE = an academic subject (math, science, language arts, history, etc.)
  - VOLUNTEERING = community service / volunteer hours
  - FIELD_TRIP = museum, educational trips, etc.
  - PRACTICAL = hands-on practical skills (cooking, wood shop, life skills, etc.)
  - READING = independent reading requirements
  - PE = physical education / sports
  - OTHER = anything else
- hoursRequired: number | null (if the doc specifies required hours, otherwise null)

Extract every distinct course and requirement you can find. Do not merge items.`,
        },
        {
          role: "user",
          content: `Parse this homeschool yearly program document:\n\n${rawText.slice(0, 10000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"items":[]}');
    const rawItems: any[] = parsed.items || [];

    if (rawItems.length === 0) {
      return NextResponse.json({ error: "No program items could be extracted from this PDF." }, { status: 422 });
    }

    // Fetch all curricula for fuzzy matching
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });
    const curricula = await db.curriculum.findMany({
      where: userRole === "ADMIN" && user?.organizationId
        ? { organizationId: user.organizationId }
        : {},
      select: { id: true, name: true, subject: true },
    });

    // Fuzzy match: compare lowercased titles
    function bestMatch(title: string) {
      const t = title.toLowerCase();
      // Exact match first
      const exact = curricula.find(
        (c) => c.name.toLowerCase() === t || c.subject?.toLowerCase() === t
      );
      if (exact) return exact;
      // Partial match (contains)
      return curricula.find(
        (c) =>
          c.name.toLowerCase().includes(t) ||
          t.includes(c.name.toLowerCase()) ||
          (c.subject && (c.subject.toLowerCase().includes(t) || t.includes(c.subject.toLowerCase())))
      ) ?? null;
    }

    const items: ParsedProgramItem[] = rawItems.map((item: any, idx: number) => {
      const match = item.type === "COURSE" ? bestMatch(item.title) : null;
      return {
        tempId: `item-${idx}`,
        rawTitle: item.title,
        title: item.title,
        description: item.description || "",
        type: item.type || "OTHER",
        hoursRequired: item.hoursRequired ?? undefined,
        suggestedCurriculumId: match?.id,
        suggestedCurriculumName: match?.name,
      };
    });

    return NextResponse.json({
      items,
      curricula: curricula.map((c) => ({ id: c.id, name: c.name, subject: c.subject })),
      pageCount: pdfData.numpages,
      rawTextLength: rawText.length,
    });
  } catch (error: any) {
    console.error("PDF parse error:", error);
    return NextResponse.json({ error: "Failed to parse PDF: " + (error?.message || "unknown error") }, { status: 500 });
  }
}
