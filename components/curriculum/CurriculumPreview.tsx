"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Award, Target, BookOpen, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CurriculumPreviewProps {
  curriculum: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  isApproving?: boolean;
}

export function CurriculumPreview({
  curriculum,
  isOpen,
  onClose,
  onApprove,
  isApproving = false
}: CurriculumPreviewProps) {
  const [expandedUnit, setExpandedUnit] = useState<number | null>(0);

  if (!curriculum) return null;

  const totalLessons = curriculum.units?.reduce(
    (acc: number, unit: any) => acc + (unit.lessons?.length || 0),
    0
  ) || 0;

  const totalPoints = curriculum.units?.reduce(
    (acc: number, unit: any) =>
      acc +
      unit.lessons?.reduce(
        (lessonAcc: number, lesson: any) =>
          lessonAcc +
          lesson.items?.reduce((itemAcc: number, item: any) => itemAcc + (item.points || 0), 0),
        0
      ),
    0
  ) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Course Preview</DialogTitle>
          <DialogDescription>
            This is how students will see this course. Review and approve to save.
          </DialogDescription>
        </DialogHeader>

        {/* Course Header */}
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6">
            <h1 className="text-3xl font-bold mb-2">{curriculum.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">{curriculum.description}</p>

            <div className="flex gap-4 flex-wrap">
              {curriculum.subject && (
                <Badge variant="secondary" className="text-sm">
                  {curriculum.subject}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4" />
                <span>{totalLessons} lessons</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-yellow-600" />
                <span>{totalPoints} points available</span>
              </div>
            </div>
          </div>

          {/* Units and Lessons */}
          <div className="space-y-3">
            {curriculum.units?.map((unit: any, unitIndex: number) => {
              const isExpanded = expandedUnit === unitIndex;
              const unitPoints = unit.lessons?.reduce(
                (acc: number, lesson: any) =>
                  acc +
                  lesson.items?.reduce(
                    (itemAcc: number, item: any) => itemAcc + (item.points || 0),
                    0
                  ),
                0
              ) || 0;

              return (
                <Card key={unitIndex} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedUnit(isExpanded ? null : unitIndex)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <ChevronRight
                            className={`h-5 w-5 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                          {unit.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {unit.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {unit.lessons?.length || 0} lessons
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {unitPoints} pts
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 bg-muted/20">
                      {unit.lessons?.map((lesson: any, lessonIndex: number) => {
                        const lessonPoints = lesson.items?.reduce(
                          (acc: number, item: any) => acc + (item.points || 0),
                          0
                        ) || 0;

                        return (
                          <div
                            key={lessonIndex}
                            className="rounded-lg border bg-background p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <Target className="h-5 w-5 text-blue-600" />
                                  {lesson.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {lesson.description}
                                </p>
                              </div>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {lessonPoints} pts
                              </Badge>
                            </div>

                            {/* Learning Objectives */}
                            {lesson.objectives && lesson.objectives.length > 0 && (
                              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-3">
                                <h5 className="text-xs font-semibold mb-2 flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  Learning Objectives
                                </h5>
                                <ul className="text-sm space-y-1">
                                  {lesson.objectives.map((obj: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <span>{obj}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Lesson Content */}
                            {lesson.contentMd && (
                              <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 rounded-md p-4">
                                <ReactMarkdown>{lesson.contentMd}</ReactMarkdown>
                              </div>
                            )}

                            {/* Checklist Items */}
                            {lesson.items && lesson.items.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-muted-foreground">
                                  Tasks to Complete
                                </h5>
                                {lesson.items.map((item: any, itemIndex: number) => (
                                  <div
                                    key={itemIndex}
                                    className="flex items-center gap-3 p-3 rounded-md border bg-background"
                                  >
                                    <div className="h-5 w-5 rounded border-2 border-primary flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-primary opacity-30" />
                                    </div>
                                    <span className="flex-1 text-sm">{item.prompt}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      +{item.points} pts
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isApproving}>
            Cancel
          </Button>
          <Button onClick={onApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700">
            {isApproving ? "Saving..." : "Approve & Save Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
