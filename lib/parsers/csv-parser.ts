import Papa from "papaparse";

export interface ParsedCurriculum {
  name: string;
  description?: string;
  units: ParsedUnit[];
}

export interface ParsedUnit {
  title: string;
  description?: string;
  order: number;
  lessons: ParsedLesson[];
}

export interface ParsedLesson {
  title: string;
  description?: string;
  contentMd: string;
  order: number;
  threshold?: number;
  objectives?: string[];
  items: ParsedItem[];
}

export interface ParsedItem {
  type: "MCQ" | "SHORT_ANSWER" | "TRUE_FALSE";
  prompt: string;
  order: number;
  choices?: string[];
  answerKey: any;
  points?: number;
}

/**
 * Parse a CSV file into curriculum structure
 * Expected CSV columns: unit, lesson, title, content, question_type, question, choices, answer
 */
export async function parseCSV(fileUrl: string): Promise<ParsedCurriculum> {
  const response = await fetch(fileUrl);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const curriculum = buildCurriculumFromRows(results.data as any[]);
          resolve(curriculum);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

function buildCurriculumFromRows(rows: any[]): ParsedCurriculum {
  const unitsMap = new Map<string, ParsedUnit>();
  const lessonsMap = new Map<string, ParsedLesson>();

  // First pass: organize data
  for (const row of rows) {
    const unitTitle = row.unit?.trim();
    const lessonTitle = row.lesson?.trim();

    if (!unitTitle || !lessonTitle) continue;

    // Create or get unit
    if (!unitsMap.has(unitTitle)) {
      unitsMap.set(unitTitle, {
        title: unitTitle,
        description: row.unit_description || "",
        order: unitsMap.size,
        lessons: [],
      });
    }

    const unitKey = `${unitTitle}:${lessonTitle}`;

    // Create or get lesson
    if (!lessonsMap.has(unitKey)) {
      lessonsMap.set(unitKey, {
        title: lessonTitle,
        description: row.lesson_description || "",
        contentMd: row.content || row.lesson_content || "",
        order: lessonsMap.size,
        threshold: parseInt(row.threshold) || 100,
        objectives: row.objectives ? row.objectives.split(";") : [],
        items: [],
      });
    }

    const lesson = lessonsMap.get(unitKey)!;

    // Add question/item if exists
    if (row.question || row.prompt) {
      const item: ParsedItem = {
        type: parseQuestionType(row.question_type || row.type),
        prompt: row.question || row.prompt,
        order: lesson.items.length,
        points: parseInt(row.points) || 1,
        answerKey: {},
      };

      // Parse choices and answer based on type
      if (item.type === "MCQ" || item.type === "TRUE_FALSE") {
        item.choices = parseChoices(row.choices);
        item.answerKey = { correct: parseCorrectAnswers(row.answer) };
      } else if (item.type === "SHORT_ANSWER") {
        item.answerKey = { patterns: [row.answer] };
      }

      lesson.items.push(item);
    }
  }

  // Build final structure
  const units: ParsedUnit[] = [];
  for (const [unitTitle, unit] of unitsMap) {
    const unitLessons: ParsedLesson[] = [];

    for (const [key, lesson] of lessonsMap) {
      if (key.startsWith(unitTitle + ":")) {
        unitLessons.push(lesson);
      }
    }

    // Sort lessons by order
    unitLessons.sort((a, b) => a.order - b.order);
    unit.lessons = unitLessons;
    units.push(unit);
  }

  units.sort((a, b) => a.order - b.order);

  return {
    name: rows[0]?.curriculum_name || "Imported Curriculum",
    description: rows[0]?.curriculum_description || "",
    units,
  };
}

function parseQuestionType(type: string): "MCQ" | "SHORT_ANSWER" | "TRUE_FALSE" {
  const normalized = type?.toLowerCase().trim();

  if (normalized?.includes("mcq") || normalized?.includes("multiple")) {
    return "MCQ";
  }
  if (normalized?.includes("true") || normalized?.includes("false")) {
    return "TRUE_FALSE";
  }
  return "SHORT_ANSWER";
}

function parseChoices(choicesStr: string): string[] {
  if (!choicesStr) return [];

  // Split by semicolon, pipe, or newline
  return choicesStr
    .split(/[;\|\n]/)
    .map((c) => c.trim())
    .filter(Boolean);
}

function parseCorrectAnswers(answerStr: string): number[] {
  if (!answerStr) return [];

  // Try to parse as comma-separated indices (0,2)
  const indices = answerStr.split(",").map((s) => {
    const num = parseInt(s.trim());
    return isNaN(num) ? -1 : num;
  });

  if (indices.some((i) => i >= 0)) {
    return indices.filter((i) => i >= 0);
  }

  // Otherwise return as single answer at index 0
  return [0];
}
