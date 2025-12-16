"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Lock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { GlossaryMarkdown } from "./glossary-markdown";

interface LessonPlayerProps {
  lesson: any;
  studentId: string;
  curriculumId: string;
  isLocked: boolean;
  previousLesson: any;
  attempts: any[];
  bestScore?: number;
}

export function LessonPlayer({
  lesson,
  studentId,
  curriculumId,
  isLocked,
  previousLesson,
  attempts,
  bestScore,
}: LessonPlayerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showContent, setShowContent] = useState(true);

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

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    isPending
                      ? "border-blue-200 bg-blue-50"
                      : itemResult.correct
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <Lock className="h-5 w-5 text-blue-600" />
                      ) : itemResult.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">Question {idx + 1}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isPending ? "Pending" : `${itemResult.points}/${item.points} points`}
                    </span>
                  </div>
                  <p className="mb-2 text-sm">{item.prompt}</p>
                  <div className="text-sm text-muted-foreground">
                    {isPending ? (
                      <span className="text-blue-700">
                        <strong>Awaiting manual review</strong> - Your answer has been submitted and will be graded soon.
                      </span>
                    ) : item.type === "CHECKBOX" ? (
                      <span>
                        Status: <strong>{itemResult.answer ? "Completed ✓" : "Not completed"}</strong>
                      </span>
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
          {lesson.items.map((item: any, idx: number) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="mb-4">
                <Label className="text-base font-medium">
                  {idx + 1}. {item.prompt}
                </Label>
                <div className="mt-1 text-xs text-muted-foreground">
                  {item.points} {item.points === 1 ? "point" : "points"}
                </div>
              </div>

              {item.type === "MCQ" && (
                <RadioGroup
                  value={answers[item.id]}
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
                  value={answers[item.id]}
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
                <div className="flex items-center space-x-3 rounded-lg border border-dashed p-4">
                  <Checkbox
                    id={`checkbox-${item.id}`}
                    checked={answers[item.id] === true}
                    onCheckedChange={(checked) => handleAnswerChange(item.id, checked === true)}
                  />
                  <Label
                    htmlFor={`checkbox-${item.id}`}
                    className="cursor-pointer text-base font-normal leading-relaxed"
                  >
                    Mark this task as complete
                  </Label>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

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
