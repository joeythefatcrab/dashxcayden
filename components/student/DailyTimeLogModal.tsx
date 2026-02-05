"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type Curriculum = {
  id: string;
  name: string;
  subject: string | null;
};

type Props = {
  curricula: Curriculum[];
  date: string; // YYYY-MM-DD format
  onComplete: () => void;
};

type TimeEntry = {
  hours: string;
  minutes: string;
};

export function DailyTimeLogModal({ curricula, date, onComplete }: Props) {
  const router = useRouter();
  const [timeEntries, setTimeEntries] = useState<Record<string, TimeEntry>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initialize with empty strings
  useEffect(() => {
    const initial: Record<string, TimeEntry> = {};
    curricula.forEach((c) => {
      initial[c.id] = { hours: "", minutes: "" };
    });
    setTimeEntries(initial);
  }, [curricula]);

  const handleHoursChange = (curriculumId: string, value: string) => {
    setTimeEntries((prev) => ({
      ...prev,
      [curriculumId]: { ...prev[curriculumId], hours: value },
    }));
  };

  const handleMinutesChange = (curriculumId: string, value: string) => {
    setTimeEntries((prev) => ({
      ...prev,
      [curriculumId]: { ...prev[curriculumId], minutes: value },
    }));
  };

  const getTotalMinutes = () => {
    return Object.values(timeEntries).reduce((sum, entry) => {
      const hours = parseInt(entry.hours) || 0;
      const minutes = parseInt(entry.minutes) || 0;
      return sum + hours * 60 + minutes;
    }, 0);
  };

  const postTimeLogs = async (logs: { curriculumId: string; minutesSpent: number }[]) => {
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/student/daily-time-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, logs }),
      });

      if (!response.ok) {
        throw new Error("Failed to save time log");
      }

      onComplete();
      router.refresh();
    } catch (error) {
      console.error("Error saving time log:", error);
      setError("Failed to save time log. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const logs = Object.entries(timeEntries).map(([curriculumId, entry]) => {
      const hours = parseInt(entry.hours) || 0;
      const minutes = parseInt(entry.minutes) || 0;
      return { curriculumId, minutesSpent: hours * 60 + minutes };
    });
    await postTimeLogs(logs);
  };

  const handleSkip = async () => {
    // Record 0 minutes for all courses so the modal won't reappear
    const logs = curricula.map((c) => ({ curriculumId: c.id, minutesSpent: 0 }));
    await postTimeLogs(logs);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTotalTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <DialogTitle>Daily Time Log</DialogTitle>
          </div>
          <DialogDescription>
            How much time did you spend on each course on{" "}
            <strong>{formatDate(date)}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {curricula.map((curriculum) => (
            <div key={curriculum.id} className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor={`${curriculum.id}-hours`} className="font-medium">
                  {curriculum.name}
                  {curriculum.subject && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({curriculum.subject})
                    </span>
                  )}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id={`${curriculum.id}-hours`}
                  type="number"
                  min="0"
                  max="24"
                  value={timeEntries[curriculum.id]?.hours || ""}
                  onChange={(e) => handleHoursChange(curriculum.id, e.target.value)}
                  placeholder="0"
                  className="w-20 text-center"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-muted-foreground">h</span>
                <Input
                  id={`${curriculum.id}-minutes`}
                  type="number"
                  min="0"
                  max="59"
                  value={timeEntries[curriculum.id]?.minutes || ""}
                  onChange={(e) => handleMinutesChange(curriculum.id, e.target.value)}
                  placeholder="0"
                  className="w-20 text-center"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
          ))}

          <div className="mt-6 rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Time</span>
              <span className="text-lg font-bold">
                {formatTotalTime(getTotalMinutes())}
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              onClick={handleSkip}
              disabled={isSubmitting}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              I didn&apos;t study yesterday
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
