import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity as ActivityIcon, Clock, User } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    days?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const days = parseInt(params.days || "7");

  // Fetch recent activity
  const activities = await db.activity.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Calculate activity stats
  const totalActivities = activities.length;
  const uniqueUsers = new Set(activities.map((a) => a.userId)).size;
  const activityTypes = activities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activityTypeColors: Record<string, string> = {
    LOGIN: "bg-blue-100 text-blue-800",
    LOGOUT: "bg-gray-100 text-gray-800",
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
    VIEW: "bg-purple-100 text-purple-800",
  };

  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          Platform-wide activity and events (last {days} days)
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActivities}</div>
            <p className="text-xs text-muted-foreground">In last {days} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg/Day</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {days > 0 ? Math.round(totalActivities / days) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Events per day</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Types Breakdown */}
      {Object.keys(activityTypes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(activityTypes).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <Badge
                    variant="secondary"
                    className={activityTypeColors[type] || ""}
                  >
                    {type}
                  </Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ActivityIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No activity yet</h3>
              <p className="text-sm text-muted-foreground">
                Activity will appear here as users interact with the platform
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Organization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(activity.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{activity.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={activityTypeColors[activity.type] || ""}
                      >
                        {activity.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm">{activity.description}</span>
                    </TableCell>
                    <TableCell>
                      {activity.user.organization ? (
                        <span className="text-sm">
                          {activity.user.organization.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
