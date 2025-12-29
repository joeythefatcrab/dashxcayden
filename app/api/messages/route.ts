import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        organizationId: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query to get messages for this user
    const messages = await db.message.findMany({
      where: {
        AND: [
          // Message hasn't expired
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          // Message is for this user
          {
            OR: [
              // All users
              { recipientType: "ALL" },
              // Specific role and either no recipientIds (all of that role) or includes this user
              {
                AND: [
                  { recipientType: user.role },
                  {
                    OR: [
                      { recipientIds: { isEmpty: true } },
                      { recipientIds: { has: user.id } },
                    ],
                  },
                ],
              },
            ],
          },
          // If message has an organizationId, it must match the user's organization
          {
            OR: [
              { organizationId: null },
              { organizationId: user.organizationId },
            ],
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        readReceipts: {
          where: {
            userId: user.id,
          },
          select: {
            readAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response to include isRead flag
    const messagesWithReadStatus = messages.map((message) => ({
      ...message,
      isRead: message.readReceipts.length > 0,
      readAt: message.readReceipts[0]?.readAt || null,
    }));

    return NextResponse.json(messagesWithReadStatus);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
