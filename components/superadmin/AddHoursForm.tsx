"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type Student = { id: string; name: string; parentName: string | null };

const CATEGORIES = ["Math", "Reading", "Writing", "Science", "History", "Art", "Music", "Physical Education", "Field Trip", "Volunteer Work", "Other"];

export function AddHoursForm({ students }: { students: Student[] }) {
  const now = new Date();
  const [studentId, setStudentId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/superadmin/reports/add-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, month: parseInt(month), year: parseInt(year), title, category, hours, description }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Added ${hours}h "${title}" to report`);
        setTitle(""); setHours(""); setDescription("");
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("Request failed");
    } finally {
      setSaving(false);
    }
  };

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add Hours to Report</CardTitle>
        <p className="text-xs text-muted-foreground">Adds an external activity entry to a student's draft report. Creates the report if it doesn't exist yet.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Student</Label>
            <Select value={studentId} onValueChange={setStudentId} required>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select student…" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.parentName ? `(${s.parentName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Input className="h-8 text-sm" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input className="h-8 text-sm" placeholder="e.g. Library visit" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Hours</Label>
            <Input className="h-8 text-sm" type="number" step="0.5" min="0.5" placeholder="2" value={hours} onChange={(e) => setHours(e.target.value)} required />
          </div>

          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 space-y-1">
            <Label className="text-xs">Description (optional)</Label>
            <Input className="h-8 text-sm" placeholder="Brief description…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="col-span-2 flex items-center gap-3">
            <Button type="submit" size="sm" disabled={saving || !studentId}>
              {saving && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Add Hours
            </Button>
            {result && <p className={`text-xs ${result.startsWith("Error") ? "text-destructive" : "text-green-600"}`}>{result}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
