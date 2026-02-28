"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Calendar, X, Check } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "P" | "S" | "V" | "NS";

type DayEntry = {
  status: Status;
  hours?: number;
  note?: string;
};

type AttendanceData = {
  present: number;
  sick: number;
  vacation: number;
  days?: Record<string, DayEntry>; // key: "YYYY-MM-DD"
};

type AutoDay = {
  date: string; // ISO string
  present: boolean;
};

type Props = {
  reportId: string;
  month: number; // 1-12
  year: number;
  initialAttendanceData: AttendanceData | null;
  autoDetectedDays: AutoDay[];
  onSave: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; ring: string }> = {
  P:  { label: "Present",   bg: "bg-green-100",  text: "text-green-800",  ring: "ring-green-400" },
  S:  { label: "Sick",      bg: "bg-yellow-100", text: "text-yellow-800", ring: "ring-yellow-400" },
  V:  { label: "Vacation",  bg: "bg-blue-100",   text: "text-blue-800",   ring: "ring-blue-400" },
  NS: { label: "No School", bg: "bg-gray-100",   text: "text-gray-500",   ring: "ring-gray-300" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function recalcTotals(days: Record<string, DayEntry>): { present: number; sick: number; vacation: number } {
  let present = 0, sick = 0, vacation = 0;
  for (const entry of Object.values(days)) {
    if (entry.status === "P") present++;
    else if (entry.status === "S") sick++;
    else if (entry.status === "V") vacation++;
  }
  return { present, sick, vacation };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DayAttendancePicker({
  reportId, month, year, initialAttendanceData, autoDetectedDays, onSave,
}: Props) {
  // Seed days map: start with auto-detected P/A, then overlay any parent-saved days
  const buildInitialDays = useCallback((): Record<string, DayEntry> => {
    const map: Record<string, DayEntry> = {};
    // Seed auto-detected present days as P
    for (const r of autoDetectedDays) {
      const key = r.date.substring(0, 10);
      if (r.present) map[key] = { status: "P" };
    }
    // Overlay with any parent-saved entries (these take full priority)
    if (initialAttendanceData?.days) {
      for (const [key, entry] of Object.entries(initialAttendanceData.days)) {
        map[key] = entry;
      }
    }
    return map;
  }, [autoDetectedDays, initialAttendanceData]);

  const [days, setDays] = useState<Record<string, DayEntry>>(buildInitialDays);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedDay, setSavedDay] = useState<string | null>(null);

  // Edit form state for the selected day
  const [editStatus, setEditStatus] = useState<Status | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editNote, setEditNote] = useState("");

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const openDay = (day: number) => {
    if (selectedDay === day) {
      setSelectedDay(null);
      return;
    }
    const key = toKey(year, month, day);
    const existing = days[key];
    setEditStatus(existing?.status ?? null);
    setEditHours(existing?.hours?.toString() ?? "");
    setEditNote(existing?.note ?? "");
    setSelectedDay(day);
    setSaveError("");
  };

  const closeDay = () => {
    setSelectedDay(null);
    setSaveError("");
  };

  const clearDay = async () => {
    if (selectedDay === null) return;
    const key = toKey(year, month, selectedDay);
    const newDays = { ...days };
    delete newDays[key];
    const totals = recalcTotals(newDays);
    const attendanceData: AttendanceData = { ...totals, days: newDays };
    setIsSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/parent/monthly-report/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, attendanceData }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setDays(newDays);
      setEditStatus(null);
      setEditHours("");
      setEditNote("");
      closeDay();
      onSave();
    } catch {
      setSaveError("Failed to clear day. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveDay = async () => {
    if (selectedDay === null) return;
    const key = toKey(year, month, selectedDay);

    const newDays = { ...days };
    if (!editStatus) {
      // Clear the day
      delete newDays[key];
    } else {
      newDays[key] = {
        status: editStatus,
        ...(editHours && parseFloat(editHours) > 0 ? { hours: parseFloat(editHours) } : {}),
        ...(editNote.trim() ? { note: editNote.trim() } : {}),
      };
    }

    const totals = recalcTotals(newDays);
    const attendanceData: AttendanceData = { ...totals, days: newDays };

    setIsSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/parent/monthly-report/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, attendanceData }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setDays(newDays);
      setSavedDay(key);
      setTimeout(() => setSavedDay(null), 1800);
      closeDay();
      onSave();
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const totals = recalcTotals(days);

  // Build the calendar grid (pad with null for leading empty cells)
  const gridCells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad end to complete the last row
  while (gridCells.length % 7 !== 0) gridCells.push(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance Calendar
        </CardTitle>
        <CardDescription>
          Click any day to set attendance, log hours, and note activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-xs font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {gridCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const key = toKey(year, month, day);
            const entry = days[key];
            const cfg = entry ? STATUS_CONFIG[entry.status as Status] : null;
            const isSelected = selectedDay === day;
            const justSaved = savedDay === key;

            return (
              <button
                key={day}
                onClick={() => openDay(day)}
                className={[
                  "relative flex flex-col items-center justify-start rounded-lg border p-1 min-h-[52px] transition-all text-left",
                  "hover:border-primary/50 hover:shadow-sm",
                  isSelected ? "ring-2 ring-primary border-primary" : "border-border",
                  cfg ? `${cfg.bg}` : "bg-background",
                  justSaved ? "ring-2 ring-green-500" : "",
                ].filter(Boolean).join(" ")}
              >
                <span className={`text-xs font-semibold ${cfg ? cfg.text : "text-foreground"}`}>
                  {day}
                </span>
                {entry && (
                  <span className={`text-[10px] font-bold mt-0.5 ${cfg?.text}`}>
                    {entry.status}
                  </span>
                )}
                {entry?.hours && (
                  <span className="text-[9px] text-muted-foreground leading-none">
                    {entry.hours}h
                  </span>
                )}
                {justSaved && (
                  <span className="absolute top-0.5 right-0.5">
                    <Check className="h-2.5 w-2.5 text-green-600" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day detail panel — appears when a day is selected */}
        {selectedDay !== null && (
          <div className="rounded-xl border border-primary/30 bg-muted/30 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">
                {MONTH_NAMES[month - 1]} {selectedDay}, {year}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeDay}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Status buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Attendance Status</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const active = editStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setEditStatus(active ? null : s)}
                      className={[
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all",
                        active
                          ? `${cfg.bg} ${cfg.text} ${cfg.ring} ring-2`
                          : "bg-background text-muted-foreground border-border hover:border-primary/40",
                      ].join(" ")}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours + Note (only shown when status is set) */}
            {editStatus && editStatus !== "NS" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="day-hours" className="text-xs text-muted-foreground">
                      Hours of School
                    </Label>
                    <Input
                      id="day-hours"
                      type="number"
                      min="0"
                      max="16"
                      step="0.5"
                      value={editHours}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditHours(e.target.value)}
                      placeholder="e.g. 5.5"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-1">
                    {/* spacer */}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="day-note" className="text-xs text-muted-foreground">
                    Activities / Notes <span className="font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="day-note"
                    value={editNote}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditNote(e.target.value)}
                    placeholder="e.g. Math, reading, PE, science experiment…"
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </>
            )}

            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}

            <div className="flex justify-between items-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={clearDay}
                disabled={isSaving}
              >
                Clear day
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs px-4"
                onClick={saveDay}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Totals row */}
        <div className="rounded-lg bg-muted/50 p-3 grid grid-cols-4 gap-2 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-green-700">{totals.present}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-700">{totals.sick}</div>
            <div className="text-xs text-muted-foreground">Sick</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">{totals.vacation}</div>
            <div className="text-xs text-muted-foreground">Vacation</div>
          </div>
          <div>
            <div className="text-lg font-bold">{totals.present + totals.sick + totals.vacation}</div>
            <div className="text-xs text-muted-foreground">Total Days</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
          {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`inline-block w-4 h-4 rounded ${STATUS_CONFIG[s].bg} border`} />
              {STATUS_CONFIG[s].label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
