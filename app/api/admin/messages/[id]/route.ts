import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and superadmins can delete messages
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify the message exists and belongs to this admin's org
    const message = await db.message.findUnique({
      where: { id },
      include: {
        sender: { select: { organizationId: true } },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Admins can only delete messages from their own organization
    if (session.user.role === "ADMIN") {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true },
      });

      if (message.organizationId !== user?.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Delete read receipts first, then the message
    await db.messageRead.deleteMany({ where: { messageId: id } });
    await db.message.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
