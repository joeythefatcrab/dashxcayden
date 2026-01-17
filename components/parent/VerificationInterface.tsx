"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Calendar, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type TimeLog = {
  id: string;
  date: Date;
  minutesSpent: number;
  student: {
    name: string;
  };
  curriculum: {
    name: string;
    subject: string | null;
  };
};

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  hoursSpent: number | null;
  category: string | null;
  report: {
    student: {
      name: string;
    };
  };
};

type Props = {
  timeLogs: TimeLog[];
  activities: Activity[];
};

export function VerificationInterface({ timeLogs: initialTimeLogs, activities: initialActivities }: Props) {
  const router = useRouter();
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [activities, setActivities] = useState(initialActivities);
  const [verifying, setVerifying] = useState<string | null>(null);

  const handleVerifyTimeLog = async (logId: string, approve: boolean) => {
    setVerifying(logId);

    try {
      const response = await fetch("/api/parent/verify-time-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId,
          approve,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify time log");
      }

      // Remove from list after verification
      setTimeLogs(prev => prev.filter(log => log.id !== logId));
      router.refresh();
    } catch (error) {
      console.error("Error verifying time log:", error);
      alert(error instanceof Error ? error.message : "Failed to verify time log");
    } finally {
      setVerifying(null);
    }
  };

  const handleVerifyActivity = async (activityId: string, approve: boolean) => {
    setVerifying(activityId);

    try {
      const response = await fetch("/api/parent/verify-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          approve,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify activity");
      }

      // Remove from list after verification
      setActivities(prev => prev.filter(act => act.id !== activityId));
      router.refresh();
    } catch (error) {
      console.error("Error verifying activity:", error);
      alert(error instanceof Error ? error.message : "Failed to verify activity");
    } finally {
      setVerifying(null);
    }
  };

  const totalPending = timeLogs.length + activities.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Verify Hours Tracking</h1>
        <p className="text-muted-foreground">
          Review and verify your student's logged hours and activities
        </p>
      </div>

      {totalPending === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              There are no pending entries to verify at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="time" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Logs ({timeLogs.length})
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activities ({activities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Time Logs</CardTitle>
                <CardDescription>
                  Review time logged by your students for their courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No time logs pending verification
                  </p>
                ) : (
                  <div className="space-y-3">
                    {timeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{log.student.name}</h4>
                              <Badge variant="secondary">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">
                              {log.curriculum.subject || log.curriculum.name}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{new Date(log.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>
                                {Math.floor(log.minutesSpent / 60)}h {log.minutesSpent % 60}m
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyTimeLog(log.id, true)}
                            disabled={verifying === log.id}
                            className="flex-1"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {verifying === log.id ? "Approving..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyTimeLog(log.id, false)}
                            disabled={verifying === log.id}
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>External Activities</CardTitle>
                <CardDescription>
                  Review activities submitted by your students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No activities pending verification
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{activity.report.student.name}</h4>
                              <Badge variant="secondary">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{activity.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{new Date(activity.date).toLocaleDateString()}</span>
                              {activity.category && (
                                <>
                                  <span>•</span>
                                  <span>{activity.category}</span>
                                </>
                              )}
                              {activity.hoursSpent && (
                                <>
                                  <span>•</span>
                                  <span>{activity.hoursSpent} hours</span>
                                </>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-sm mt-2">{activity.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyActivity(activity.id, true)}
                            disabled={verifying === activity.id}
                            className="flex-1"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {verifying === activity.id ? "Approving..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerifyActivity(activity.id, false)}
                            disabled={verifying === activity.id}
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
