import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity } from "lucide-react";
import { RoleSwitcher } from "@/components/superadmin/RoleSwitcher";
import { DeleteUserButton } from "@/components/superadmin/DeleteUserButton";

export default async function SuperAdminDashboard() {
  // Simple user count - should always work
  const userCount = await db.user.count();

  // Get recent users
  const recentUsers = await db.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor your platform's key metrics</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide user count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              New users this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Switcher for QA */}
      <RoleSwitcher />

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user.email}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {user.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <DeleteUserButton userId={user.id} userName={user.name || user.email} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
