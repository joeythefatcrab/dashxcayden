"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckSquare,
  Square,
  PenLine,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronRight,
  Printer,
  CheckCircle2,
  Clock,
  Send,
  ArrowRight,
  MinusCircle,
  MoveRight,
} from "lucide-react";
import Link from "next/link";

type Completion = {
  id: string;
  status: string;
  content: string | null;
  adminNote: string | null;
  completedAt: string | null;
  reviewedAt: string | null;
};

type ChecklistItem = {
  id: string;
  sectionTitle: string | null;
  title: string;
  description: string | null;
  itemType: string;
  curriculumId: string | null;
  isOptional: boolean;
  requiresReview: boolean;
  completion: Completion | null;
};

type Section = { title: string; items: ChecklistItem[] };

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:     { label: "",           color: "",                          icon: null },
  IN_PROGRESS: { label: "I/P",        color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  DONE:        { label: "DONE",       color: "bg-green-100 text-green-800",   icon: <CheckCircle2 className="h-3 w-3" /> },
  SUBMITTED:   { label: "Submitted",  color: "bg-blue-100 text-blue-800",     icon: <Send className="h-3 w-3" /> },
  APPROVED:    { label: "DONE",       color: "bg-green-100 text-green-800",   icon: <CheckCircle2 className="h-3 w-3" /> },
  OPT_OUT:     { label: "OPT OUT",    color: "bg-gray-100 text-gray-500",     icon: <MinusCircle className="h-3 w-3" /> },
  MOVE:        { label: "MOVE",       color: "bg-purple-100 text-purple-700", icon: <MoveRight className="h-3 w-3" /> },
};

interface Props {
  studentId: string;
  programId: string;
}

export function ProgramChecklist({ studentId, programId }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Essay dialog state
  const [essayItem, setEssayItem] = useState<ChecklistItem | null>(null);
  const [essayText, setEssayText] = useState("");
  const [essaySubmitting, setEssaySubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/student/my-checklist?studentId=${studentId}&programId=${programId}`)
      .then((r) => r.json())
      .then((data) => {
        setSections(data.sections || []);
        setEnrollmentId(data.enrollmentId || null);
      })
      .finally(() => setLoading(false));
  }, [studentId, programId]);

  const updateCompletion = async (itemId: string, status: string, content?: string) => {
    if (!enrollmentId) return;
    setSaving(itemId);
    try {
      const res = await fetch(`/api/student/my-checklist/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, status, content }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === itemId ? { ...i, completion: updated } : i
          ),
        }))
      );
    } finally {
      setSaving(null);
    }
  };

  const handleEssaySubmit = async () => {
    if (!essayItem || !essayText.trim()) return;
    setEssaySubmitting(true);
    await updateCompletion(essayItem.id, "SUBMITTED", essayText.trim());
    setEssaySubmitting(false);
    setEssayItem(null);
    setEssayText("");
  };

  const toggleSection = (title: string) =>
    setCollapsed((p) => ({ ...p, [title]: !p[title] }));

  // Stats
  const allItems = sections.flatMap((s) => s.items);
  const total = allItems.length;
  const done = allItems.filter((i) => ["DONE", "APPROVED", "SUBMITTED", "OPT_OUT"].includes(i.completion?.status || "")).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No checklist items yet.</p>
        <p className="text-sm mt-1">Ask your admin to import the program PDF.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Program Checklist</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{done} of {total} items complete</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1">
            <Printer className="h-4 w-4" />Print
          </Button>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-8 print:hidden">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Overall completion</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Checklist by section */}
      <div className="space-y-6 print:space-y-4">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.title];
          const sectionDone = section.items.filter((i) =>
            ["DONE", "APPROVED", "SUBMITTED", "OPT_OUT"].includes(i.completion?.status || "")
          ).length;

          return (
            <div key={section.title} className="border rounded-xl overflow-hidden print:border-0">
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 text-left print:pointer-events-none"
                onClick={() => toggleSection(section.title)}
              >
                <span className="font-semibold text-sm uppercase tracking-wide">{section.title}</span>
                <div className="flex items-center gap-2 print:hidden">
                  <span className="text-xs text-muted-foreground">{sectionDone}/{section.items.length}</span>
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Items */}
              {!isCollapsed && (
                <div className="divide-y">
                  {section.items.map((item) => {
                    const status = item.completion?.status || "PENDING";
                    const statusMeta = STATUS_META[status] || STATUS_META.PENDING;
                    const isDone = ["DONE", "APPROVED"].includes(status);
                    const isOptedOut = status === "OPT_OUT";
                    const isSaving = saving === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${isOptedOut ? "opacity-50" : ""}`}
                      >
                        {/* Checkbox / icon */}
                        <div className="mt-0.5 shrink-0">
                          {item.itemType === "CHECKBOX" && (
                            <button
                              disabled={isSaving || !enrollmentId}
                              onClick={() => updateCompletion(item.id, isDone ? "PENDING" : "DONE")}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-40"
                            >
                              {isSaving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : isDone ? (
                                <CheckSquare className="h-5 w-5 text-green-600" />
                              ) : (
                                <Square className="h-5 w-5" />
                              )}
                            </button>
                          )}
                          {item.itemType === "ESSAY" && (
                            <PenLine className={`h-5 w-5 mt-0.5 ${status === "SUBMITTED" || status === "APPROVED" ? "text-green-600" : "text-blue-500"}`} />
                          )}
                          {item.itemType === "COURSE_LINK" && (
                            <BookOpen className={`h-5 w-5 mt-0.5 ${isDone ? "text-green-600" : "text-purple-500"}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${isDone || isOptedOut ? "line-through text-muted-foreground" : ""}`}>
                            {item.isOptional && <span className="text-muted-foreground">(Optional) </span>}
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                          {/* Admin note on returned essay */}
                          {item.completion?.adminNote && status === "PENDING" && (
                            <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1">
                              Admin note: {item.completion.adminNote}
                            </p>
                          )}
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                          {statusMeta.label && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.color}`}>
                              {statusMeta.icon}{statusMeta.label}
                            </span>
                          )}

                          {/* ESSAY: Write/Resubmit */}
                          {item.itemType === "ESSAY" && !["SUBMITTED", "APPROVED"].includes(status) && enrollmentId && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                setEssayItem(item);
                                setEssayText(item.completion?.content || "");
                              }}
                            >
                              <PenLine className="h-3 w-3" />
                              {item.completion?.content ? "Edit" : "Write"}
                            </Button>
                          )}

                          {/* COURSE_LINK: Go to course */}
                          {item.itemType === "COURSE_LINK" && item.curriculumId && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                              <Link href={`/my-courses/${item.curriculumId}`}>
                                <ArrowRight className="h-3 w-3" />Course
                              </Link>
                            </Button>
                          )}

                          {/* Status menu for non-essay non-course items */}
                          {item.itemType === "CHECKBOX" && !isDone && enrollmentId && (
                            <div className="flex gap-1">
                              {status !== "IN_PROGRESS" && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground px-1"
                                  onClick={() => updateCompletion(item.id, "IN_PROGRESS")}
                                  title="Mark In Progress"
                                >I/P</button>
                              )}
                              {item.isOptional && status !== "OPT_OUT" && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground px-1"
                                  onClick={() => updateCompletion(item.id, "OPT_OUT")}
                                  title="Opt Out"
                                >OUT</button>
                              )}
                              {status !== "MOVE" && (
                                <button
                                  className="text-xs text-muted-foreground hover:text-foreground px-1"
                                  onClick={() => updateCompletion(item.id, "MOVE")}
                                  title="Move to Next Program"
                                >MOVE</button>
                              )}
                            </div>
                          )}

                          {/* Undo any special status back to pending */}
                          {["IN_PROGRESS", "OPT_OUT", "MOVE"].includes(status) && enrollmentId && (
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => updateCompletion(item.id, "PENDING")}
                              title="Clear status"
                            >✕</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Essay submission dialog */}
      <Dialog open={!!essayItem} onOpenChange={(open) => { if (!open) { setEssayItem(null); setEssayText(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{essayItem?.title}</DialogTitle>
            <DialogDescription>
              Write your submission below. It will be sent to your admin for review.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Write your essay, write-up, or notes here..."
            rows={12}
            className="mt-2"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => { setEssayItem(null); setEssayText(""); }}>
              Cancel
            </Button>
            <Button onClick={handleEssaySubmit} disabled={essaySubmitting || !essayText.trim()} className="gap-2">
              {essaySubmitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><Send className="h-4 w-4" />Submit to Admin</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
