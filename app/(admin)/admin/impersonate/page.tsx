import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ImpersonateUserList } from "@/components/admin/ImpersonateUserList";

export default async function ImpersonatePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  // Get all users for impersonation
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: [
      { role: "asc" },
      { email: "asc" },
    ],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Impersonation</h1>
        <p className="text-muted-foreground mt-2">
          Select a user to view the application as them. This is for testing and debugging purposes only.
        </p>
      </div>

      <ImpersonateUserList users={users} />
    </div>
  );
}
