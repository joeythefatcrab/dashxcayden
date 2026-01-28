"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { RevisionModal } from "./RevisionModal";

type EssaySubmission = {
  id: string;
  type: "essay";
  itemId: string;
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  curriculumName: string;
  status: "DRAFT" | "SUBMITTED" | "GRADED" | "REVISION_REQUESTED";
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  revisionNote: string | null;
  revisionRequestedAt: string | null;
};

type ShortAnswerItem = {
  itemId: string;
  itemPrompt: string;
  answer: string;
  needsGrading: boolean;
  revisionRequested: boolean;
  revisionNote: string | null;
  revisionRequestedAt: string | null;
  points: number;
  maxPoints: number;
  feedback: string | null;
};

type ShortAnswerAttempt = {
  attemptId: string;
  lessonId: string;
  lessonTitle: string;
  unitTitle: string;
  curriculumName: string;
  submittedAt: string;
  items: ShortAnswerItem[];
};

type Props = {
  essaySubmissions: EssaySubmission[];
  shortAnswerAttempts: ShortAnswerAttempt[];
};

export function SubmissionsClient({
  essaySubmissions,
  shortAnswerAttempts,
}: Props) {
  const router = useRouter();
  const [selectedRevision, setSelectedRevision] = useState<{
    type: "essay" | "shortAnswer";
    lessonId: string;
    itemId: string;
    attemptId?: string;
    revisionNote: string;
    originalAnswer?: string;
    itemPrompt?: string;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getStatusBadge = (
    status:
      | "DRAFT"
      | "SUBMITTED"
      | "GRADED"
      | "REVISION_REQUESTED"
      | "PENDING_GRADING"
  ) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            Draft
          </Badge>
        );
      case "SUBMITTED":
      case "PENDING_GRADING":
        return (
          <Badge variant="default" className="gap-1 bg-blue-500">
            <Clock className="h-3 w-3" />
            Pending Grading
          </Badge>
        );
      case "GRADED":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Graded
          </Badge>
        );
      case "REVISION_REQUESTED":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Revision Requested
          </Badge>
        );
    }
  };

  const handleEssayClick = (submission: EssaySubmission) => {
    if (submission.status === "REVISION_REQUESTED") {
      setSelectedRevision({
        type: "essay",
        lessonId: submission.lessonId,
        itemId: submission.itemId,
        revisionNote: submission.revisionNote || "",
      });
    } else {
      // Navigate to lesson to view essay
      router.push(`/lesson/${submission.lessonId}`);
    }
  };

  const handleShortAnswerClick = (
    attempt: ShortAnswerAttempt,
    item: ShortAnswerItem
  ) => {
    if (item.revisionRequested) {
      setSelectedRevision({
        type: "shortAnswer",
        lessonId: attempt.lessonId,
        itemId: item.itemId,
        attemptId: attempt.attemptId,
        revisionNote: item.revisionNote || "",
        originalAnswer: item.answer,
        itemPrompt: item.itemPrompt,
      });
    } else {
      // Just navigate to lesson
      router.push(`/lesson/${attempt.lessonId}`);
    }
  };

  // Combine all submissions into one list
  const allSubmissions = [
    ...essaySubmissions.map((sub) => ({
      ...sub,
      displayType: "Essay" as const,
      sortDate: sub.submittedAt || new Date(0).toISOString(),
    })),
    ...shortAnswerAttempts.flatMap((attempt) =>
      attempt.items.map((item) => ({
        id: `${attempt.attemptId}-${item.itemId}`,
        type: "shortAnswer" as const,
        displayType: "Short Answer" as const,
        itemId: item.itemId,
        attemptId: attempt.attemptId,
        lessonId: attempt.lessonId,
        lessonTitle: attempt.lessonTitle,
        unitTitle: attempt.unitTitle,
        curriculumName: attempt.curriculumName,
        status: item.revisionRequested
          ? ("REVISION_REQUESTED" as const)
          : item.needsGrading
          ? ("PENDING_GRADING" as const)
          : ("GRADED" as const),
        submittedAt: attempt.submittedAt,
        sortDate: attempt.submittedAt,
        grade: item.points && item.maxPoints ? (item.points / item.maxPoints) * 100 : null,
        feedback: item.feedback,
        revisionNote: item.revisionNote,
        revisionRequestedAt: item.revisionRequestedAt,
        itemPrompt: item.itemPrompt,
        answer: item.answer,
        needsGrading: item.needsGrading,
        revisionRequested: item.revisionRequested,
        attempt,
        item,
      }))
    ),
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Submissions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions yet</p>
              <p className="text-sm mt-1">
                Your submitted work will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.displayType === "Essay" ? (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{submission.displayType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium text-sm truncate">
                            {submission.curriculumName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {submission.unitTitle}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm">
                          {submission.lessonTitle}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {submission.submittedAt
                          ? formatDistanceToNow(new Date(submission.submittedAt), {
                              addSuffix: true,
                            })
                          : "Not submitted"}
                      </TableCell>
                      <TableCell>
                        {submission.grade !== null && submission.grade !== undefined ? (
                          <span className="text-sm font-medium">
                            {Math.round(submission.grade)}%
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.status === "REVISION_REQUESTED" ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              if (submission.type === "essay") {
                                handleEssayClick(submission as EssaySubmission);
                              } else if (
                                submission.type === "shortAnswer" &&
                                submission.attempt &&
                                submission.item
                              ) {
                                handleShortAnswerClick(
                                  submission.attempt,
                                  submission.item
                                );
                              }
                            }}
                          >
                            Revise
                          </Button>
                        ) : submission.status === "GRADED" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              router.push(`/lesson/${submission.lessonId}`);
                            }}
                          >
                            View
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              router.push(`/lesson/${submission.lessonId}`);
                            }}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RevisionModal
        isOpen={!!selectedRevision}
        onClose={() => {
          setSelectedRevision(null);
          router.refresh();
        }}
        revision={selectedRevision}
      />
    </>
  );
}
