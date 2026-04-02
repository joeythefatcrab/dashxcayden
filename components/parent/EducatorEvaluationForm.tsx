"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Props = {
  reportId: string;
  initialAnswers: any;
  onSave: () => void;
};

export function EducatorEvaluationForm({ reportId, initialAnswers, onSave }: Props) {
  const init = initialAnswers && typeof initialAnswers === "object" ? initialAnswers : {};

  const [answers, setAnswers] = useState({
    educatorName: init.educatorName ?? "",
    successes:    init.successes    ?? init.parentSuccesses ?? "", // fall back to old key
    programTargets: init.programTargets ?? init.programCompletions ?? "",
    needsHelp:    init.needsHelp    ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = (key: string, val: string) => setAnswers((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/parent/educator-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, answers }),
      });
      if (!res.ok) throw new Error("Failed to save");
      onSave();
    } catch {
      alert("Failed to save answers");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Study Progress</CardTitle>
        <p className="text-sm text-muted-foreground">
          Answer the questions below to complete the report.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <Label htmlFor="educatorName">Name of person filling out form</Label>
          <Input
            id="educatorName"
            value={answers.educatorName}
            onChange={(e) => set("educatorName", e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="successes">Any educator or student success?</Label>
          <Textarea
            id="successes"
            value={answers.successes}
            onChange={(e) => set("successes", e.target.value)}
            placeholder="Describe any successes from this month…"
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="programTargets">Any program targets completed?</Label>
          <Textarea
            id="programTargets"
            value={answers.programTargets}
            onChange={(e) => set("programTargets", e.target.value)}
            placeholder="List any completed programs, courses, or targets…"
            rows={2}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="needsHelp">Anything you would like to share or need help with?</Label>
          <Textarea
            id="needsHelp"
            value={answers.needsHelp}
            onChange={(e) => set("needsHelp", e.target.value)}
            placeholder="Any needs, questions, or communications…"
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
