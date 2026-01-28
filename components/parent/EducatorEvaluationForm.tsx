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
  const defaultAnswers = {
    parentSuccesses: "",
    studentSuccesses: "",
    progressRating: "",
    progressExplanation: "",
    mostSuccessful: "",
    programCompletions: "",
    needsHelp: "",
  };

  const [answers, setAnswers] = useState({
    ...defaultAnswers,
    ...(initialAnswers || {}),
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/parent/educator-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save answers");
      }

      onSave();
    } catch (error) {
      console.error("Error saving answers:", error);
      alert("Failed to save answers");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Educator Evaluation</CardTitle>
        <p className="text-sm text-muted-foreground">
          Answer these questions to complete the monthly report. Your answers will be
          included exactly as written in the generated report.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="parentSuccesses">
            What successes did you have this month?
          </Label>
          <Textarea
            id="parentSuccesses"
            value={answers.parentSuccesses || ""}
            onChange={(e) =>
              setAnswers({ ...answers, parentSuccesses: e.target.value })
            }
            placeholder="Describe your successes as an educator this month..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentSuccesses">
            What successes did your student have this month?
          </Label>
          <Textarea
            id="studentSuccesses"
            value={answers.studentSuccesses || ""}
            onChange={(e) =>
              setAnswers({ ...answers, studentSuccesses: e.target.value })
            }
            placeholder="Describe your student's successes this month..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="progressRating">
            On a scale of 1 to 10, how would you rate your student's overall progress
            this period?
          </Label>
          <Input
            id="progressRating"
            type="number"
            min="1"
            max="10"
            value={answers.progressRating || ""}
            onChange={(e) =>
              setAnswers({ ...answers, progressRating: e.target.value })
            }
            placeholder="1-10"
            className="w-24"
          />
          <Label htmlFor="progressExplanation" className="text-sm text-muted-foreground">
            If not 10, please explain:
          </Label>
          <Textarea
            id="progressExplanation"
            value={answers.progressExplanation || ""}
            onChange={(e) =>
              setAnswers({ ...answers, progressExplanation: e.target.value })
            }
            placeholder="Explanation (if rating is not 10)..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mostSuccessful">
            What do you feel was most successful?
          </Label>
          <Textarea
            id="mostSuccessful"
            value={answers.mostSuccessful || ""}
            onChange={(e) =>
              setAnswers({ ...answers, mostSuccessful: e.target.value })
            }
            placeholder="Describe what was most successful..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="programCompletions">
            Were there any program completions?
          </Label>
          <Textarea
            id="programCompletions"
            value={answers.programCompletions || ""}
            onChange={(e) =>
              setAnswers({ ...answers, programCompletions: e.target.value })
            }
            placeholder="List any completed programs or courses..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="needsHelp">
            Is there anything that you need help on or would like to communicate?
          </Label>
          <Textarea
            id="needsHelp"
            value={answers.needsHelp || ""}
            onChange={(e) => setAnswers({ ...answers, needsHelp: e.target.value })}
            placeholder="Any needs, questions, or communications..."
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Answers"}
        </Button>
      </CardContent>
    </Card>
  );
}
