import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const terms = searchParams.get("terms");

    if (!terms) {
      return NextResponse.json({ error: "No terms provided" }, { status: 400 });
    }

    const termList = terms.split(",").map((t) => t.trim().toLowerCase());

    const glossaryTerms = await db.glossaryTerm.findMany({
      where: {
        term: {
          in: termList,
        },
      },
    });

    // Create a map for easy lookup
    const glossaryMap: Record<string, any> = {};
    glossaryTerms.forEach((term) => {
      glossaryMap[term.term.toLowerCase()] = {
        id: term.id,
        term: term.term,
        definition: term.definition,
        derivation: term.derivation,
        mediaUrl: term.mediaUrl,
        mediaType: term.mediaType,
      };
    });

    return NextResponse.json(glossaryMap);
  } catch (error) {
    console.error("Glossary fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch glossary terms" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { term, definition, derivation, mediaUrl, mediaType } = body;

    if (!term || !definition) {
      return NextResponse.json(
        { error: "Term and definition are required" },
        { status: 400 }
      );
    }

    const glossaryTerm = await db.glossaryTerm.create({
      data: {
        term: term.trim(),
        definition: definition.trim(),
        derivation: derivation?.trim(),
        mediaUrl,
        mediaType,
      },
    });

    return NextResponse.json(glossaryTerm, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Term already exists" },
        { status: 409 }
      );
    }
    console.error("Glossary create error:", error);
    return NextResponse.json(
      { error: "Failed to create glossary term" },
      { status: 500 }
    );
  }
}
