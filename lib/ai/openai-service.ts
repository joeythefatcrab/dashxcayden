import OpenAI from "openai";

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. AI features will not work.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

// Type definitions
export type CurriculumWireframe = {
  title: string;
  description?: string;
  subject?: string;
  gradeLevel?: number;
  outline?: string; // Text outline or description
  imageUrl?: string; // URL to wireframe image
};

export type GeneratedCurriculum = {
  name: string;
  description: string;
  subject: string;
  grade?: number;
  units: Array<{
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      title: string;
      description: string;
      contentMd: string;
      order: number;
      threshold: number;
      objectives: string[];
      items: Array<{
        type: "MCQ" | "SHORT_ANSWER" | "ESSAY" | "TRUE_FALSE";
        prompt: string;
        order: number;
        choices?: string[];
        answerKey: any;
        points: number;
      }>;
    }>;
  }>;
};

export type AssignmentRequest = {
  topic: string;
  gradeLevel?: number;
  difficulty?: "easy" | "medium" | "hard";
  numQuestions?: number;
  questionTypes?: Array<"MCQ" | "SHORT_ANSWER" | "ESSAY" | "TRUE_FALSE">;
};

/**
 * Generate a full curriculum from a wireframe or description
 */
export async function generateCurriculumFromWireframe(
  wireframe: CurriculumWireframe
): Promise<GeneratedCurriculum> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  const systemPrompt = `You are an expert curriculum designer for homeschool education.
Your task is to create detailed, engaging curricula that follow best educational practices.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.

The curriculum should:
- Be age-appropriate for the grade level
- Include clear learning objectives
- Have detailed lesson content in markdown format
- Include varied assessment items (MCQ, short answer, etc.)
- Follow a logical progression from basic to advanced concepts

Structure your response as a JSON object matching this schema:
{
  "name": "Curriculum Name",
  "description": "Brief description",
  "subject": "Subject area",
  "grade": number or null,
  "units": [
    {
      "title": "Unit Title",
      "description": "Unit description",
      "order": 1,
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "contentMd": "Full lesson content in markdown",
          "order": 1,
          "threshold": 70,
          "objectives": ["Learning objective 1", "Learning objective 2"],
          "items": [
            {
              "type": "MCQ",
              "prompt": "Question text",
              "order": 1,
              "choices": ["Option A", "Option B", "Option C", "Option D"],
              "answerKey": { "correct": [1] },
              "points": 1
            }
          ]
        }
      ]
    }
  ]
}`;

  const userPrompt = `Create a complete curriculum based on this information:

Title: ${wireframe.title}
${wireframe.description ? `Description: ${wireframe.description}` : ""}
${wireframe.subject ? `Subject: ${wireframe.subject}` : ""}
${wireframe.gradeLevel ? `Grade Level: ${wireframe.gradeLevel}` : ""}
${wireframe.outline ? `\nOutline/Requirements:\n${wireframe.outline}` : ""}

Create at least 2-3 units with 2-3 lessons each. Each lesson should have:
- Rich markdown content (at least 300 words)
- Clear learning objectives
- 3-5 assessment questions of varied types

Response format: JSON only (no markdown code blocks)`;

  try {
    // If there's an image, use vision API
    if (wireframe.imageUrl) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: wireframe.imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      return JSON.parse(content);
    } else {
      // Text-only generation
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `Failed to generate curriculum: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate assignments/questions for a specific topic
 */
export async function generateAssignment(
  request: AssignmentRequest
): Promise<any[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  const systemPrompt = `You are an expert educator creating assessment questions.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no code blocks, just raw JSON.

Create questions that:
- Are clear and unambiguous
- Match the specified grade level and difficulty
- Have correct and complete answer keys
- Are educationally sound

Response format: Array of question objects in JSON`;

  const userPrompt = `Create ${request.numQuestions || 5} assessment questions about: ${request.topic}

${request.gradeLevel ? `Grade Level: ${request.gradeLevel}` : ""}
${request.difficulty ? `Difficulty: ${request.difficulty}` : ""}
${request.questionTypes ? `Question Types: ${request.questionTypes.join(", ")}` : "Use varied types"}

Response format: JSON array of question objects like this:
[
  {
    "type": "MCQ",
    "prompt": "Question text?",
    "choices": ["A", "B", "C", "D"],
    "answerKey": { "correct": [1] },
    "points": 1
  }
]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(content);
    // Handle both array and object with questions array
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      `Failed to generate assignment: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Enhance existing curriculum content
 */
export async function enhanceLessonContent(
  topic: string,
  currentContent: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables."
    );
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are an expert educator. Enhance lesson content to be more engaging, clear, and educational. Return the enhanced content in markdown format.",
      },
      {
        role: "user",
        content: `Enhance this lesson content about "${topic}":\n\n${currentContent}\n\nMake it more engaging and add relevant examples, but keep the same general structure.`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  });

  return response.choices[0].message.content || currentContent;
}
