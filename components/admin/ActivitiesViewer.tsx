"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Activity = {
  id: string;
  userId: string;
  userRole: string;
  type: string;
  description: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export function ActivitiesViewer() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (roleFilter !== "ALL") {
        params.append("role", roleFilter);
      }
      if (typeFilter !== "ALL") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/admin/activities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setTotal(data.total);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load activities");
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      setError("Failed to load activities. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [roleFilter, typeFilter, offset]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "default";
      case "PARENT":
        return "secondary";
      case "ADMIN":
        return "outline";
      case "SUPERADMIN":
        return "destructive";
      default:
        return "default";
    }
  };

  const getActivityTypeColor = (type: string) => {
    if (type.includes("SUBMIT")) return "text-blue-600";
    if (type.includes("GRADE")) return "text-green-600";
    if (type.includes("REVISION")) return "text-orange-600";
    if (type.includes("COMPLETE")) return "text-purple-600";
    if (type.includes("CREATE")) return "text-cyan-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="STUDENT">Students</SelectItem>
                  <SelectItem value="PARENT">Parents</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                  <SelectItem value="SUPERADMIN">Superadmins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="ESSAY_SUBMIT">Essay Submissions</SelectItem>
                  <SelectItem value="SHORT_ANSWER_SUBMIT">Short Answer Submissions</SelectItem>
                  <SelectItem value="LESSON_COMPLETE">Lesson Completions</SelectItem>
                  <SelectItem value="SHORT_ANSWER_GRADE">Grading</SelectItem>
                  <SelectItem value="SHORT_ANSWER_REVISION_REQUEST">Revision Requests</SelectItem>
                  <SelectItem value="REPORT_GENERATE">Report Generation</SelectItem>
                  <SelectItem value="STUDENT_CREATE">Student Creation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => loadActivities()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Activities ({total} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium mb-2">Error loading activities</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Make sure you've run the SQL migration to add the userRole column to UserActivity table.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Activity Type</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {activity.user.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(activity.userRole)}>
                            {activity.userRole}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${getActivityTypeColor(activity.type)}`}>
                            {activity.type.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm">{activity.description}</div>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <details className="mt-1">
                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                View details
                              </summary>
                              <pre className="text-xs mt-1 p-2 bg-muted rounded">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
