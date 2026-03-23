import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ImpersonateUserList } from "@/components/admin/ImpersonateUserList";

export default async function ImpersonatePage() {
  const session = await auth();

  // @ts-ignore
  const userRole: string = session?.user?.realRole || session?.user?.role || "";
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(userRole)) {
    redirect("/dashboard");
  }

  const isSuperAdmin = userRole === "SUPERADMIN";

  let users;
  if (isSuperAdmin) {
    // Superadmins can see all users
    users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });
  } else {
    // Admins can only impersonate PARENT and STUDENT within their org
    const adminUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    users = await db.user.findMany({
      where: {
        role: { in: ["PARENT", "STUDENT"] },
        ...(adminUser?.organizationId
          ? { organizationId: adminUser.organizationId }
          : {}),
      },
      select: { id: true, email: true, name: true, role: true },
      orderBy: [{ role: "asc" }, { email: "asc" }],
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Impersonation</h1>
        <p className="text-muted-foreground mt-2">
          {isSuperAdmin
            ? "Select a user to view the application as them. This is for testing and debugging purposes only."
            : "Select a parent or student to view the application as them. This is for support and debugging purposes only."}
        </p>
      </div>

      <ImpersonateUserList users={users} />
    </div>
  );
}
