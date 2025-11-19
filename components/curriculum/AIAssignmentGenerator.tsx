"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Sparkles, Wand2, Loader2, Plus } from "lucide-react";

type AIAssignmentGeneratorProps = {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string | null;
  currentQuestionCount: number;
};

export function AIAssignmentGenerator({
  lessonId,
  lessonTitle,
  lessonDescription,
  currentQuestionCount,
}: AIAssignmentGeneratorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [questionCount, setQuestionCount] = useState("5");
  const [instructions, setInstructions] = useState("");
  const [questionTypes, setQuestionTypes] = useState("MCQ, Short Answer");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionCount || parseInt(questionCount) < 1) {
      setError("Please enter a valid number of questions (minimum 1)");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          lessonTitle,
          lessonDescription,
          questionCount: parseInt(questionCount),
          instructions,
          questionTypes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      // Reset form
      setQuestionCount("5");
      setInstructions("");
      setQuestionTypes("MCQ, Short Answer");
      setIsOpen(false);

      // Refresh the page to show new questions
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-purple-500 bg-purple-50 hover:bg-purple-100"
        >
          <Wand2 className="mr-2 h-3 w-3 text-purple-600" />
          <span className="text-purple-700">AI Generate Questions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleGenerate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI-Powered Question Generator
            </DialogTitle>
            <DialogDescription>
              Generate assessment questions for "{lessonTitle}" using AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current Status */}
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Current lesson status:</p>
              <p className="text-muted-foreground">
                This lesson currently has {currentQuestionCount} question
                {currentQuestionCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <Label htmlFor="questionCount">
                Number of Questions to Generate *
              </Label>
              <Input
                id="questionCount"
                type="number"
                min="1"
                max="20"
                placeholder="e.g., 5"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                required
              />
            </div>

            {/* Question Types */}
            <div className="space-y-2">
              <Label htmlFor="questionTypes">Question Types</Label>
              <Input
                id="questionTypes"
                placeholder="e.g., MCQ, Short Answer, True/False"
                value={questionTypes}
                onChange={(e) => setQuestionTypes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Specify what types of questions you'd like (comma-separated)
              </p>
            </div>

            {/* Additional Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">
                Additional Instructions (Optional)
              </Label>
              <Textarea
                id="instructions"
                placeholder="Any specific topics, difficulty level, or requirements...

Example:
- Focus on critical thinking
- Include real-world applications
- Make questions progressively harder
- Cover topics: photosynthesis, cell structure"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* AI Features Info */}
            <div className="rounded-md bg-gradient-to-r from-purple-50 to-pink-50 p-4">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-purple-900">AI will generate:</p>
                  <ul className="mt-2 space-y-1 text-purple-700">
                    <li className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      Multiple choice questions with distractors
                    </li>
                    <li className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      Short answer questions with answer keys
                    </li>
                    <li className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      Point values based on difficulty
                    </li>
                    <li className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      Questions aligned to lesson content
                    </li>
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate {questionCount} Question{parseInt(questionCount) > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
