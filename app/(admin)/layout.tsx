import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/auth/dashboard-nav";
import { ReportSubmissionBanner } from "@/components/admin/ReportSubmissionBanner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // @ts-ignore - role exists in session
  // Check realRole if impersonating, otherwise check current role
  const userRole = session.user.realRole || session.user.role;
  if (!["ADMIN", "SUPERADMIN"].includes(userRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />
      <main className="flex-1 bg-muted/30">{children}</main>
      <ReportSubmissionBanner />
    </div>
  );
}
