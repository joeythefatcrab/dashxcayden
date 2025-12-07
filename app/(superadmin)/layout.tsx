import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, Users, Activity, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only SUPERADMIN role can access this area
  if (!session?.user || session.user.role !== "SUPERADMIN") {
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
      name: "Organizations",
      href: "/superadmin/organizations",
      icon: Building2,
    },
    {
      name: "Activity",
      href: "/superadmin/activity",
      icon: Activity,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Superadmin Console</h1>
        </div>
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-yellow-100">
        <div className="bg-red-500 text-white p-4 m-4">
          LAYOUT TEST - If you see this RED box, the layout is rendering
        </div>
        <div className="mx-auto max-w-7xl px-8 py-8 bg-blue-100">
          <div className="bg-green-500 text-white p-4 mb-4">
            CHILDREN WRAPPER - This should be visible
          </div>
          {children}
          <div className="bg-purple-500 text-white p-4 mt-4">
            AFTER CHILDREN - This should be visible too
          </div>
        </div>
      </main>
    </div>
  );
}
