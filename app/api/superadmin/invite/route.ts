import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await auth();

  // Only superadmins can create invites
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate invite code
    const inviteCode = crypto.randomBytes(16).toString("hex");

    // Create invite (store in User with pending status)
    const invite = await db.user.create({
      data: {
        email,
        role,
        name: "Pending",
        password: inviteCode, // Temporary - will be replaced when they set password
      },
    });

    // Get the correct base URL from the request headers
    const headersList = request.headers;
    const host = headersList.get("host") || "";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    const inviteUrl = `${baseUrl.replace(/\/+$/, "")}/accept-invite?code=${inviteCode}&email=${encodeURIComponent(email)}`;

    return NextResponse.json({
      success: true,
      inviteUrl,
      inviteCode,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}
