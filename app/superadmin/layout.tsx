import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Users, LayoutDashboard, Settings, Eye, Activity } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only SUPERADMIN role can access this area
  // Check realRole if impersonating, otherwise check current role
  // @ts-ignore
  const userRole = session?.user?.realRole || session?.user?.role;
  if (!session?.user || userRole !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  const navigation = [
    {
      name: "Overview",
      href: "/superadmin/overview",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      href: "/superadmin/users",
      icon: Users,
    },
    {
      name: "Activity Logs",
      href: "/superadmin/activity-logs",
      icon: Activity,
    },
    {
      name: "Impersonate",
      href: "/admin/impersonate",
      icon: Eye,
    },
    {
      name: "System Settings",
      href: "/superadmin/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold text-foreground">Superadmin Console</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
