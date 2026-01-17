"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

type RecentLog = {
  studentName: string;
  date: string;
  type: "time" | "activity";
};

export function RecentTimeLogsNotification() {
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentLogs() {
      try {
        const response = await fetch("/api/parent/recent-time-logs");
        if (response.ok) {
          const data = await response.json();
          setRecentLogs(data.recentLogs || []);
        }
      } catch (error) {
        console.error("Error fetching recent logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentLogs();
  }, []);

  if (loading || recentLogs.length === 0) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">
              Recent Time Logs
            </h4>
            <div className="space-y-1">
              {recentLogs.map((log, index) => (
                <p key={index} className="text-sm text-blue-700">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  <strong>{log.studentName}</strong> logged{" "}
                  {log.type === "time" ? "study time" : "an activity"} on{" "}
                  {new Date(log.date).toLocaleDateString()}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
