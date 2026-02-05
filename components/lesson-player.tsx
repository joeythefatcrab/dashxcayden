"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Lock, CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { GlossaryMarkdown } from "./glossary-markdown";
import { FloatingEssaySubmission } from "./student/FloatingEssaySubmission";

interface LessonPlayerProps {
  lesson: any;
  studentId: string;
  curriculumId: string;
  isLocked: boolean;
  previousLesson: any;
  attempts: any[];
  bestScore?: number;
  bestAttempt?: any;
}

export function LessonPlayer({
  lesson,
  studentId,
  curriculumId,
  isLocked,
  previousLesson,
  attempts,
  bestScore,
  bestAttempt,
}: LessonPlayerProps) {
  const router = useRouter();

  // Initialize answers with previous best attempt if available
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    if (bestAttempt?.detail) {
      const initialAnswers: Record<string, any> = {};
      Object.entries(bestAttempt.detail).forEach(([itemId, itemData]: [string, any]) => {
        if (itemData.answer !== undefined && itemData.answer !== null) {
          initialAnswers[itemId] = itemData.answer;
        }
      });
      return initialAnswers;
    }
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showContent, setShowContent] = useState(true);
  const [essayPopupOpen, setEssayPopupOpen] = useState(false);
  const [selectedEssayItem, setSelectedEssayItem] = useState<any>(null);

  // Reset state when lesson changes
  useEffect(() => {
    // Reset all form state when switching to a new lesson
    setResult(null);
    setShowContent(true);
    setEssayPopupOpen(false);
    setSelectedEssayItem(null);

    // Re-initialize answers from best attempt for the new lesson
    if (bestAttempt?.detail) {
      const initialAnswers: Record<string, any> = {};
      Object.entries(bestAttempt.detail).forEach(([itemId, itemData]: [string, any]) => {
        if (itemData.answer !== undefined && itemData.answer !== null) {
          initialAnswers[itemId] = itemData.answer;
        }
      });
      setAnswers(initialAnswers);
    } else {
      setAnswers({});
    }
  }, [lesson.id, bestAttempt]); // Re-run when lesson ID or best attempt changes

  const handleAnswerChange = (itemId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          curriculumId,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      const data = await response.json();
      setResult(data);
      setShowContent(false);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLocked) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href={`/my-courses/${curriculumId}`}>
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle>Lesson Locked</CardTitle>
                <CardDescription>
                  Complete the previous lesson to unlock this one
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You need to score at least <strong>{previousLesson?.threshold}%</strong> on{" "}
              <strong>{previousLesson?.title}</strong> to unlock this lesson.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    const hasPendingItems = result.pendingReview || false;

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href={`/my-courses/${curriculumId}`}>
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {hasPendingItems ? (
                <Lock className="h-6 w-6 text-blue-600" />
              ) : result.score >= lesson.threshold ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-orange-600" />
              )}
              {hasPendingItems
                ? "Awaiting Review"
                : result.score >= lesson.threshold
                ? "Lesson Complete!"
                : "Try Again"}
            </CardTitle>
            <CardDescription>
              {hasPendingItems ? (
                <>Your assignment is being reviewed by your parent/teacher</>
              ) : (
                <>You scored {result.score}% ({result.earned}/{result.maxScore} points)</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPendingItems && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Status:</strong> Your written assignments are being reviewed. Your final score will be updated once grading is complete.
                </p>
              </div>
            )}

            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Performance</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full ${
                    hasPendingItems
                      ? "bg-blue-600"
                      : result.score >= lesson.threshold
                      ? "bg-green-600"
                      : "bg-orange-600"
                  }`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {hasPendingItems ? "Partial score (pending manual grading)" : `Threshold: ${lesson.threshold}%`}
              </div>
            </div>

            {!hasPendingItems && result.score >= lesson.threshold && (
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  You met the threshold! The next lesson is now unlocked.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setShowContent(true);
                  setAnswers({});
                }}
              >
                Try Again
              </Button>
              <Button asChild>
                <Link href={`/my-courses/${curriculumId}`}>Continue to Next Lesson</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesson.items.map((item: any, idx: number) => {
              const itemResult = result.detail[item.id];
              const isPending = itemResult.needsGrading === true;
              const isOptedOut = itemResult.optedOut === true;

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    isOptedOut
                      ? "border-gray-200 bg-gray-50"
                      : isPending
                      ? "border-blue-200 bg-blue-50"
                      : itemResult.correct
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isOptedOut ? (
                        <span className="text-gray-500">—</span>
                      ) : isPending ? (
                        <Lock className="h-5 w-5 text-blue-600" />
                      ) : itemResult.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">Question {idx + 1}</span>
                      {item.isOptional && <span className="ml-2 text-xs text-muted-foreground">(Optional)</span>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isOptedOut ? "Skipped" : isPending ? "Pending" : `${itemResult.points}/${item.points} points`}
                    </span>
                  </div>
                  <p className="mb-2 text-sm">{item.prompt}</p>
                  <div className="text-sm text-muted-foreground">
                    {isOptedOut ? (
                      <span className="text-gray-600">
                        <strong>Skipped</strong> - You chose to skip this optional item
                      </span>
                    ) : isPending ? (
                      <span className="text-blue-700">
                        <strong>Awaiting manual review</strong> - Your answer has been submitted and will be graded soon.
                      </span>
                    ) : item.type === "CHECKBOX" ? (
                      <span>
                        Status: <strong>{itemResult.answer ? "Completed ✓" : "Not completed"}</strong>
                      </span>
                    ) : item.type === "MCQ" || item.type === "TRUE_FALSE" ? (
                      <div className="space-y-1">
                        <div>
                          Your answer: <strong className={itemResult.correct ? "text-green-700" : "text-red-700"}>
                            {item.type === "TRUE_FALSE"
                              ? (itemResult.answer === 0 ? "True" : "False")
                              : (item.choices as string[])[itemResult.answer]}
                          </strong>
                        </div>
                        {!itemResult.correct && item.answerKey && (
                          <div className="text-green-700">
                            Correct answer: <strong>
                              {item.type === "TRUE_FALSE"
                                ? (item.answerKey.correct[0] === 0 ? "True" : "False")
                                : item.answerKey.correct.map((idx: number) => (item.choices as string[])[idx]).join(", ")}
                            </strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span>
                        Your answer: <strong>{String(itemResult.answer)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href={`/my-courses/${curriculumId}`}>
        <Button variant="ghost" size="sm" className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-muted-foreground">{lesson.description}</p>
        )}
        {bestScore !== undefined && (
          <div className="mt-2 text-sm text-muted-foreground">
            Best score: <strong>{bestScore}%</strong>
          </div>
        )}
      </div>

      {showContent && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <GlossaryMarkdown content={lesson.contentMd} />
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assessment</CardTitle>
          <CardDescription>
            {lesson.items.length} questions • Passing threshold: {lesson.threshold}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {lesson.items.map((item: any, idx: number) => {
            // Check if this item was completed correctly in the best attempt
            const itemResult = bestAttempt?.detail?.[item.id];
            const wasCorrect = itemResult?.correct === true;
            const wasCompleted = itemResult?.answer !== undefined && itemResult?.answer !== null;

            return (
              <div key={item.id} className={`rounded-lg border p-4 ${wasCorrect ? 'border-green-200 bg-green-50/30' : ''}`}>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-medium">
                        {idx + 1}. {item.prompt}
                      </Label>
                      {wasCorrect && (
                        <span title="Previously completed correctly">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.points} {item.points === 1 ? "point" : "points"}
                      {wasCompleted && !wasCorrect && " • Previously attempted"}
                    </div>
                  </div>
                </div>

              {item.type === "MCQ" && (
                <RadioGroup
                  value={answers[item.id] !== undefined ? String(answers[item.id]) : ""}
                  onValueChange={(value) => handleAnswerChange(item.id, parseInt(value))}
                >
                  {(item.choices as string[]).map((choice: string, choiceIdx: number) => (
                    <div key={choiceIdx} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(choiceIdx)} id={`${item.id}-${choiceIdx}`} />
                      <Label htmlFor={`${item.id}-${choiceIdx}`} className="cursor-pointer">
                        {choice}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {item.type === "TRUE_FALSE" && (
                <RadioGroup
                  value={answers[item.id] !== undefined ? String(answers[item.id]) : ""}
                  onValueChange={(value) => handleAnswerChange(item.id, parseInt(value))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id={`${item.id}-true`} />
                    <Label htmlFor={`${item.id}-true`} className="cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id={`${item.id}-false`} />
                    <Label htmlFor={`${item.id}-false`} className="cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {item.type === "SHORT_ANSWER" && (
                <Input
                  placeholder="Type your answer here..."
                  value={answers[item.id] || ""}
                  onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                />
              )}

              {item.type === "CHECKBOX" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 rounded-lg border border-dashed p-4">
                    <Checkbox
                      id={`checkbox-${item.id}`}
                      checked={answers[item.id] === true}
                      onCheckedChange={(checked) => handleAnswerChange(item.id, checked === true)}
                      disabled={answers[item.id] === "OPTED_OUT"}
                    />
                    <Label
                      htmlFor={`checkbox-${item.id}`}
                      className="cursor-pointer text-base font-normal leading-relaxed"
                    >
                      Mark this task as complete
                    </Label>
                  </div>
                  {item.isOptional && (
                    <Button
                      type="button"
                      variant={answers[item.id] === "OPTED_OUT" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleAnswerChange(item.id, answers[item.id] === "OPTED_OUT" ? null : "OPTED_OUT")}
                      className="w-full text-xs"
                    >
                      {answers[item.id] === "OPTED_OUT" ? "Undo Skip" : "Skip (Optional)"}
                    </Button>
                  )}
                </div>
              )}

              {item.type === "ESSAY" && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedEssayItem(item);
                      setEssayPopupOpen(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Write Essay
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Click to open the essay editor
                  </p>
                </div>
              )}
            </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Essay Popup */}
      {selectedEssayItem && (
        <FloatingEssaySubmission
          studentId={studentId}
          lessonId={lesson.id}
          itemId={selectedEssayItem.id}
          prompt={selectedEssayItem.prompt}
          isOpen={essayPopupOpen}
          onClose={() => {
            setEssayPopupOpen(false);
            // Mark essay as answered so submit button can be enabled
            handleAnswerChange(selectedEssayItem.id, "ESSAY_SUBMITTED");
          }}
        />
      )}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setShowContent(!showContent)}
        >
          {showContent ? "Hide" : "Show"} Content
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length !== lesson.items.length}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Answers"
          )}
        </Button>
      </div>
    </div>
  );
}
