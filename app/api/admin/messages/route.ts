import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and superadmins can send messages
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, recipientType, recipientIds, expiresAt } = body;

    if (!content || !recipientType) {
      return NextResponse.json(
        { error: "Content and recipient type are required" },
        { status: 400 }
      );
    }

    // Get user's organization ID
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    // Create the message
    const message = await db.message.create({
      data: {
        title,
        content,
        senderId: session.user.id,
        recipientType,
        recipientIds: recipientIds || [],
        organizationId: user?.organizationId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and superadmins can view all messages
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    // Build query based on role
    const where: any = {};

    if (session.user.role === "ADMIN") {
      // Admins only see messages from their organization
      where.organizationId = user?.organizationId;
    }
    // Superadmins see all messages (no where clause needed)

    const messages = await db.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        readReceipts: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
