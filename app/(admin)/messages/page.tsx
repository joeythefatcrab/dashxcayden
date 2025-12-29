import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessagesList } from "@/components/admin/MessagesList";
import { SendMessageForm } from "@/components/admin/SendMessageForm";

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Send messages and notifications to students, parents, and other admins
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Send Message Form */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Send New Message</h2>
          <SendMessageForm />
        </div>

        {/* Messages List */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Sent Messages</h2>
          <MessagesList />
        </div>
      </div>
    </div>
  );
}
