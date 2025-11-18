import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET - List all parents (already handled in the page, but useful for API)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parents = await db.user.findMany({
      where: {
        role: "PARENT",
        adminId: session.user.id,
      },
      include: {
        _count: {
          select: {
            children: true,
            curricula: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ parents });
  } catch (error) {
    console.error("Error fetching parents:", error);
    return NextResponse.json(
      { error: "Failed to fetch parents" },
      { status: 500 }
    );
  }
}

// POST - Create a new parent account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create parent account
    const parent = await db.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        role: "PARENT",
        adminId: session.user.id, // Link to admin
      },
    });

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        role: parent.role,
      },
    });
  } catch (error) {
    console.error("Error creating parent:", error);
    return NextResponse.json(
      { error: "Failed to create parent account" },
      { status: 500 }
    );
  }
}
