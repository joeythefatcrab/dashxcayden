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
          // Ensure data.recentLogs is an array
          if (Array.isArray(data.recentLogs)) {
            setRecentLogs(data.recentLogs);
          } else {
            console.warn("Recent logs data is not an array:", data);
            setRecentLogs([]);
          }
        } else {
          console.error("Failed to fetch recent logs:", response.status, response.statusText);
          setRecentLogs([]);
        }
      } catch (error) {
        console.error("Error fetching recent logs:", error);
        setRecentLogs([]);
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
              {recentLogs.map((log, index) => {
                const d = new Date(log.date);
                const dateStr = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
                return (
                  <p key={index} className="text-sm text-blue-700">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    <strong>{log.studentName}</strong> logged{" "}
                    {log.type === "time" ? "study time" : "an activity"} on{" "}
                    {dateStr}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
