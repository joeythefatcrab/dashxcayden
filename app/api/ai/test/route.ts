import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  return NextResponse.json({
    authenticated: !!session?.user,
    userRole: session?.user?.role || null,
    openAIConfigured: !!process.env.OPENAI_API_KEY,
    apiKeyPresent: process.env.OPENAI_API_KEY ? "Yes (hidden)" : "No",
    chatEndpointExists: true,
    curriculumEndpointExists: true,
    assignmentEndpointExists: true,
  });
}
