import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ActivitiesViewer } from "@/components/admin/ActivitiesViewer";

export default async function ActivitiesPage() {
  const session = await auth();

  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Activity Log</h1>
        <p className="text-muted-foreground mt-2">
          Track all user activities across the platform
        </p>
      </div>

      <ActivitiesViewer />
    </div>
  );
}
