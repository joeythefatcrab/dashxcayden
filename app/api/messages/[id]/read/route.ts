import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageId = params.id;

    // Check if already read
    const existingRead = await db.messageRead.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: session.user.id,
        },
      },
    });

    if (existingRead) {
      return NextResponse.json(existingRead);
    }

    // Mark as read
    const readReceipt = await db.messageRead.create({
      data: {
        messageId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(readReceipt);
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageId = params.id;

    // Unmark as read (dismiss)
    await db.messageRead.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unmarking message as read:", error);
    return NextResponse.json(
      { error: "Failed to unmark message" },
      { status: 500 }
    );
  }
}
