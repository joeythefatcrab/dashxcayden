"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";

interface AIProgressReportProps {
  studentId: string;
  studentName: string;
}

export function AIProgressReport({ studentId, studentName }: AIProgressReportProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!isExpanded && !report) {
      // First time opening - generate report
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/student/progress-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate report");
        }

        setReport(data.report);
        setStats(data.stats);
        setIsExpanded(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/student/progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReport(data.report);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="font-medium">AI Progress Report</span>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-4 space-y-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 p-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {report && (
            <>
              {stats && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Courses: {stats.enrolledCourses}</span>
                  <span>Attempts: {stats.totalAttempts}</span>
                  {stats.avgScore !== null && (
                    <span className="font-medium text-purple-700 dark:text-purple-400">
                      Avg Score: {stats.avgScore}%
                    </span>
                  )}
                </div>
              )}

              <div className="prose prose-sm max-w-none text-sm">
                <div className="whitespace-pre-wrap text-foreground/90">
                  {report}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isLoading}
                className="mt-2"
              >
                <Sparkles className="mr-2 h-3 w-3" />
                Regenerate Report
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
