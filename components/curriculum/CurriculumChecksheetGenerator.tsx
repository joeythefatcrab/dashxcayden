"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookOpen, Loader2, Sparkles } from "lucide-react";

/**
 * Component for generating curriculum checksheets using Loopi Curriculum Planner
 * For parents/teachers/admins only
 */
export function CurriculumChecksheetGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string | null>(null);

  // Form fields
  const [prompt, setPrompt] = useState("");
  const [studentAge, setStudentAge] = useState("");
  const [subject, setSubject] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Please enter a curriculum description");
      return;
    }

    setIsGenerating(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          studentAge: studentAge ? parseInt(studentAge) : undefined,
          subject: subject.trim() || undefined,
          durationWeeks: durationWeeks ? parseInt(durationWeeks) : undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate curriculum");
      }

      setResult(data.checksheet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate curriculum");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPrompt("");
    setStudentAge("");
    setSubject("");
    setDurationWeeks("");
    setError("");
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-500 bg-green-50 hover:bg-green-100">
          <BookOpen className="mr-2 h-4 w-4 text-green-600" />
          <span className="text-green-700">Generate Checksheet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleGenerate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Loopi Curriculum Planner
            </DialogTitle>
            <DialogDescription>
              Generate a study-tech style curriculum checksheet for your homeschool program
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Main Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Curriculum Description *</Label>
              <Textarea
                id="prompt"
                placeholder="Example: Create a 4-week 5th-grade fractions unit in checksheet form with Study Tech principles"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Describe what curriculum you want to create
              </p>
            </div>

            {/* Optional metadata fields */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="studentAge">Student Age (optional)</Label>
                <Input
                  id="studentAge"
                  type="number"
                  min="5"
                  max="18"
                  placeholder="e.g., 10"
                  value={studentAge}
                  onChange={(e) => setStudentAge(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Math, Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationWeeks">Duration (weeks, optional)</Label>
                <Input
                  id="durationWeeks"
                  type="number"
                  min="1"
                  max="52"
                  placeholder="e.g., 4"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                />
              </div>
            </div>

            {/* Info box */}
            <div className="rounded-md bg-gradient-to-r from-green-50 to-emerald-50 p-4">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-green-900">
                    Loopi Curriculum Planner will create:
                  </p>
                  <ul className="mt-2 space-y-1 text-green-700">
                    <li>• Study-tech style checksheets</li>
                    <li>• Clear learning objectives</li>
                    <li>• Progressive skill building</li>
                    <li>• Age-appropriate content</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className="space-y-2">
                <Label>Generated Checksheet</Label>
                <div className="rounded-md border bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{result}</pre>
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy the checksheet above and paste it into your curriculum planning document
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isGenerating}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Checksheet...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Checksheet
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
