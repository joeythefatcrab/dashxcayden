"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, RotateCcw, Loader2, PenLine, ChevronDown, ChevronUp, X } from "lucide-react";

type Submission = {
  id: string;
  status: string;
  content: string | null;
  adminNote: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
  item: { id: string; sectionTitle: string | null; title: string };
  enrollment: { student: { id: string; name: string; grade: number | null } };
};

export function ChecklistReviewPanel({ programId }: { programId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/programs/${programId}/submissions`)
      .then((r) => r.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [programId]);

  const cancelRevision = async (completionId: string) => {
    setSaving(completionId);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/submissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setSubmissions((prev) =>
        prev.map((s) => (s.id === completionId ? { ...s, ...updated } : s))
      );
    } finally {
      setSaving(null);
    }
  };

  const review = async (completionId: string, status: "APPROVED" | "PENDING") => {
    setSaving(completionId);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/submissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completionId, status, adminNote: notes[completionId] || undefined }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setSubmissions((prev) =>
        prev.map((s) => (s.id === completionId ? { ...s, ...updated } : s))
      );
    } finally {
      setSaving(null);
    }
  };

  const pending = submissions.filter((s) => s.status === "SUBMITTED");
  const reviewed = submissions.filter((s) => s.status !== "SUBMITTED");

  if (loading) return (
    <Card>
      <CardContent className="pt-6 text-center text-muted-foreground py-10">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </CardContent>
    </Card>
  );

  if (submissions.length === 0) return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4" /> Essay Submissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No submissions yet.</p>
      </CardContent>
    </Card>
  );

  const renderRow = (sub: Submission) => {
    const isExpanded = expanded === sub.id;
    const isSaving = saving === sub.id;

    return (
      <div key={sub.id} className="border rounded-lg overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30"
          onClick={() => setExpanded(isExpanded ? null : sub.id)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-medium text-sm truncate">{sub.item.title}</span>
            {sub.item.sectionTitle && (
              <span className="text-xs text-muted-foreground hidden sm:inline">{sub.item.sectionTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-sm text-muted-foreground">{sub.enrollment.student.name}</span>
            <Badge variant={sub.status === "APPROVED" ? "default" : "secondary"} className="text-xs">
              {sub.status === "SUBMITTED" ? "Needs Review" : sub.status}
            </Badge>
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
            {/* Essay content */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Student Submission
              </p>
              <div className="rounded-lg border bg-background p-3 text-sm whitespace-pre-wrap">
                {sub.content || <span className="text-muted-foreground italic">No content submitted.</span>}
              </div>
            </div>

            {/* Admin note */}
            {sub.status !== "APPROVED" && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Note to Student (optional)
                </p>
                <Textarea
                  value={notes[sub.id] || ""}
                  onChange={(e) => setNotes((p) => ({ ...p, [sub.id]: e.target.value }))}
                  placeholder="Add a note if returning for revision..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            )}

            {sub.adminNote && sub.status !== "SUBMITTED" && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Your note: </span>{sub.adminNote}
              </div>
            )}

            {/* Actions */}
            {sub.status !== "APPROVED" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={isSaving}
                  onClick={() => review(sub.id, "APPROVED")}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Approve
                </Button>
                {sub.status === "SUBMITTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    disabled={isSaving}
                    onClick={() => review(sub.id, "PENDING")}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Return for Revision
                  </Button>
                )}
                {sub.status === "PENDING" && sub.adminNote && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive hover:text-destructive"
                    disabled={isSaving}
                    onClick={() => cancelRevision(sub.id)}
                  >
                    <X className="h-4 w-4" />
                    Cancel Revision
                  </Button>
                )}
              </div>
            )}

            {sub.status === "APPROVED" && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Approved {sub.reviewedAt ? `on ${new Date(sub.reviewedAt).toLocaleDateString()}` : ""}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenLine className="h-4 w-4" />
          Essay Submissions
          {pending.length > 0 && (
            <Badge variant="destructive" className="text-xs">{pending.length} pending</Badge>
          )}
        </CardTitle>
        <CardDescription>Student essay and write-up submissions from the program checklist.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pending.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Needs Review</p>
            {pending.map(renderRow)}
          </div>
        )}
        {reviewed.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reviewed</p>
            {reviewed.map(renderRow)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
