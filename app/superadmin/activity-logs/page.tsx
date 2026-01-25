"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, RefreshCw, Search } from "lucide-react";

type ActivityLog = {
  id: string;
  userId: string;
  type: string;
  description: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

type ActivityResponse = {
  activities: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
};

const ACTIVITY_TYPES = [
  { value: "", label: "All Types" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "VIEW", label: "View" },
];

export default function ActivityLogsPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (typeFilter) params.set("type", typeFilter);

      const response = await fetch(`/api/superadmin/activity-logs?${params}`);
      if (response.ok) {
        const data: ActivityResponse = await response.json();
        setActivities(data.activities);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [typeFilter, offset]);

  const filteredActivities = activities.filter((activity) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      activity.user.name?.toLowerCase().includes(search) ||
      activity.user.email.toLowerCase().includes(search) ||
      activity.description.toLowerCase().includes(search)
    );
  });

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "LOGIN":
        return "bg-green-500";
      case "LOGOUT":
        return "bg-gray-500";
      case "CREATE":
        return "bg-blue-500";
      case "UPDATE":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      case "VIEW":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "destructive";
      case "ADMIN":
        return "default";
      case "PARENT":
        return "secondary";
      case "STUDENT":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground mt-2">
          Monitor user sign-ins and system activities
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type-filter">Activity Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchActivities} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Showing {filteredActivities.length} of {total} activities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activities found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className={`rounded-full p-2 ${getActivityTypeColor(activity.type)}`}>
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {activity.user.name || activity.user.email}
                      </span>
                      <Badge variant={getRoleBadgeColor(activity.user.role)}>
                        {activity.user.role}
                      </Badge>
                      <Badge variant="outline">{activity.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{activity.user.email}</span>
                      <span>•</span>
                      <span>
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Metadata
                        </summary>
                        <pre className="mt-2 rounded bg-muted p-2 overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && total > limit && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
