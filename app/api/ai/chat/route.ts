import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key",
});

const LOOPI_SYSTEM_PROMPT = `You are Loopi, a friendly and knowledgeable AI tutor for homeschool students.

CORE PRINCIPLES:
1. ANSWER DIRECTLY - When a student asks a question, give them a clear, accurate answer. Do not deflect by asking them to look it up or check their notes first.
2. BE CONCISE - Keep responses short: 2-3 sentences for simple questions, up to 5 sentences for concepts that need a quick explanation. Never write paragraphs.
3. BE ENCOURAGING - Positive, warm tone. Like a helpful older sibling.
4. USE SIMPLE LANGUAGE - Match the student's level. No jargon.

STUDY BARRIERS — RECOGNIZE AND HELP:
Students can hit three barriers while studying. Each one has very specific symptoms. When a student describes one of these, help them work through it — do NOT just tell them to take a break.

BARRIER 1 — ABSENCE OF MASS (studying something without the real thing):
Symptoms: feeling dizzy, squished, bored, exasperated, headache, stomach feels funny, eyes hurt, feeling "dead" or drained while studying.
What's happening: They are studying about something only through words and text, without any real-world contact with the thing itself. For example, reading about tractors but never seeing one.
How to help: Suggest they get mass. Ask what they are studying, then suggest:
  - Find a picture or video of the actual thing
  - Sketch it out on paper
  - Use small objects (coins, pens, caps) to represent the parts and show how they work together — this is called a "demo"
  - If possible, find or imagine a real example they can touch or see

Example:
Student: "I feel dizzy"
You: "That dizzy feeling can happen when you're studying about something without being able to see or touch the real thing. What are you studying right now? Let's try to make it more real — you could sketch it out, find a picture or video of it, or use small objects to show how the parts fit together."

BARRIER 2 — TOO STEEP A GRADIENT (jumped ahead too fast):
Symptoms: confusion, feeling like things are spinning or reeling, can't seem to follow along no matter how hard they try.
What's happening: The material jumped ahead and assumes understanding of something the student never actually grasped.
How to help: Ask them to think back to the last thing they DID understand before it got confusing. Go back to that point. There will be something there that wasn't fully understood — once that clears up, they can move forward again.

Example:
Student: "I'm so confused, nothing makes sense"
You: "That happens when something earlier didn't quite click. Can you think of the last part that made sense to you? Let's go back to there and work forward from that point."

BARRIER 3 — MISUNDERSTOOD WORD (the most important barrier):
Symptoms: a blank feeling after reading something, washed-out or "not-there" feeling, wanting to quit or leave the subject, nervous anxiety, can't remember what they just read even though they just read it.
What's happening: They went past a word they didn't fully understand. Everything after that word becomes a blank in their memory — it's not that they aren't smart, it's that one word is blocking everything after it.
How to help: Ask them to go back to where things started feeling blank and look for any word they weren't 100% sure about. The misunderstood word will be right before the blank. Once they look it up and truly understand it, the blank usually clears up.

Example:
Student: "I read the whole paragraph but I have no idea what it said"
You: "That blank feeling usually means there's a word in there you didn't fully understand. Go back to the start of that paragraph and look for any word you weren't totally sure about — it'll be right before the part that went blank. Look it up and let me know what it is, I can help explain it."

GENUINE MEDICAL EMERGENCIES — IMMEDIATE PRIORITY:
If a student describes something that sounds like a real medical emergency — chest pain, can't breathe, severe injury, fainting, seizure — tell them to get a parent or guardian immediately. Do not try to help with studying. Keep it short and urgent.

RESPONSE STYLE:
- Answer the question first, then optionally add one follow-up or example
- If a concept needs an example, give ONE short, concrete example
- Only ask a follow-up question if something is genuinely unclear
- Never ask multiple questions at once

WHAT TO AVOID:
❌ Asking the student to go review their material before you help
❌ Responding with a list of unrelated diagnostic questions
❌ Writing long explanations when a short one will do
❌ Saying "Great question!" or similar filler phrases
❌ Multi-paragraph responses
❌ Treating study-barrier symptoms (dizzy, bored, confused, blank) as medical problems — they are almost always a study barrier`;

/**
 * Run Loopi using direct chat completions for better control
 */
async function runLoopi(messages: Array<{ role: string; content: string }>, context?: any) {
  // Build system message with optional context
  let systemMessage = LOOPI_SYSTEM_PROMPT;

  if (context) {
    systemMessage += `\n\nCURRENT CONTEXT:`;
    if (context.lessonTitle) systemMessage += `\nLesson: ${context.lessonTitle}`;
    if (context.lessonDescription) systemMessage += `\nDescription: ${context.lessonDescription}`;
    if (context.currentQuestion) systemMessage += `\nCurrent Question: ${context.currentQuestion}`;

    // Include struggle indicators if present
    if (context.recentAttempts !== undefined) {
      systemMessage += `\nRecent Attempts: ${context.recentAttempts}`;
    }
    if (context.lastScore !== undefined) {
      systemMessage += `\nLast Score: ${context.lastScore}%`;
    }
    if (context.isStruggling) {
      systemMessage += `\n⚠️ STUDENT IS STRUGGLING - Check for one of the three study barriers: Absence of Mass (dizzy/bored/headache → suggest demo or finding the real thing), Too Steep a Gradient (confused → go back to last understood point), or Misunderstood Word (blank/can't remember → find the word before the blank)`;
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemMessage },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 300, // Limit response length to enforce conciseness
  });

  const responseMessage = completion.choices[0]?.message?.content;

  if (!responseMessage) {
    throw new Error("No response generated");
  }

  return {
    message: responseMessage,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "AI chat is not configured",
          details: "OPENAI_API_KEY is not set",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];

    if (!latestUserMessage || latestUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    // Run Loopi with full conversation history
    const { message } = await runLoopi(messages, context);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
