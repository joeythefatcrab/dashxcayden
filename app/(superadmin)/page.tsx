import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Activity, TrendingUp } from "lucide-react";

export default async function SuperAdminDashboard() {
  // Fetch overview stats
  const [userCount, orgCount, activityCount] = await Promise.all([
    db.user.count(),
    db.organization.count(),
    db.activity.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ]);

  // Get user breakdown by role
  const usersByRole = await db.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const stats = [
    {
      name: "Total Users",
      value: userCount,
      icon: Users,
      change: "+12%",
      changeType: "positive",
    },
    {
      name: "Organizations",
      value: orgCount,
      icon: Building2,
      change: "+3",
      changeType: "positive",
    },
    {
      name: "Activity (7d)",
      value: activityCount,
      icon: Activity,
      change: "+23%",
      changeType: "positive",
    },
    {
      name: "Growth Rate",
      value: "8.2%",
      icon: TrendingUp,
      change: "+2.1%",
      changeType: "positive",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform-wide overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> from
                  last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usersByRole.map((group) => (
              <div key={group.role} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="font-medium capitalize">
                    {group.role.toLowerCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {group._count} users
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {((group._count / userCount) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
