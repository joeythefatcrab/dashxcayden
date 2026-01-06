"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Save } from "lucide-react";

type AttendanceData = {
  present: number;
  sick: number;
  vacation: number;
};

type Props = {
  reportId: string;
  initialAttendance?: AttendanceData;
  onSave?: () => void;
};

export function AttendanceTracker({ reportId, initialAttendance, onSave }: Props) {
  const [attendance, setAttendance] = useState<AttendanceData>({
    present: initialAttendance?.present || 0,
    sick: initialAttendance?.sick || 0,
    vacation: initialAttendance?.vacation || 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Check if there are changes from initial
    const changed =
      attendance.present !== (initialAttendance?.present || 0) ||
      attendance.sick !== (initialAttendance?.sick || 0) ||
      attendance.vacation !== (initialAttendance?.vacation || 0);
    setHasChanges(changed);
  }, [attendance, initialAttendance]);

  const handleChange = (field: keyof AttendanceData, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setAttendance((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/parent/monthly-report/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          attendanceData: attendance,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save attendance");
      }

      setHasChanges(false);
      onSave?.();
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalDays = attendance.present + attendance.sick + attendance.vacation;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Tracking
            </CardTitle>
            <CardDescription className="mt-1">
              Track school days for APS monthly reporting requirements
            </CardDescription>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="present">Present Days</Label>
            <Input
              id="present"
              type="number"
              min="0"
              value={attendance.present}
              onChange={(e) => handleChange("present", e.target.value)}
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sick">Sick Days</Label>
            <Input
              id="sick"
              type="number"
              min="0"
              value={attendance.sick}
              onChange={(e) => handleChange("sick", e.target.value)}
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vacation">Vacation Days</Label>
            <Input
              id="vacation"
              type="number"
              min="0"
              value={attendance.vacation}
              onChange={(e) => handleChange("vacation", e.target.value)}
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Total Days</Label>
            <div className="flex h-10 items-center justify-center rounded-md border bg-muted font-semibold">
              {totalDays}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <strong>Note:</strong> Arizona homeschool requirements specify at least 175 days of instruction per year.
        </div>
      </CardContent>
    </Card>
  );
}
