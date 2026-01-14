import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const validated = cookieStore.get("signup_code_validated");

    return NextResponse.json({ validated: !!validated });
  } catch (error) {
    return NextResponse.json({ validated: false });
  }
}
