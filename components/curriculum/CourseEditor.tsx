"use client";

import { useState, useCallback } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Save,
  BookOpen,
  FileText,
  ClipboardList,
  X,
  Paperclip,
  Check,
} from "lucide-react";

// APS subject categories (must match MonthlyReportRenderer)
const APS_SUBJECTS = [
  "Study Skills/Study Technology",
  "Reading",
  "Vocabulary",
  "Handwriting",
  "Creative Writing",
  "Grammar",
  "Spelling",
  "Mathematics",
  "Geography",
  "American/World History",
  "Economics/Money",
  "Government/Civics",
  "Science",
  "Research",
  "Performing Arts",
  "Foreign Language",
  "PE",
  "Educational Films",
  "Seminars",
  "Field Trips",
  "Online Coursework",
  "Electives",
  "Other",
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────

interface CurriculumData {
  id: string;
  name: string;
  description?: string | null;
  apsSubject?: string | null;
  units: UnitData[];
}

interface UnitData {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: LessonData[];
}

interface LessonData {
  id: string;
  title: string;
  description?: string | null;
  contentMd: string;
  threshold: number;
  order: number;
  objectives: string[];
  attachmentUrl?: string | null;
  items: ItemData[];
}

interface ItemData {
  id: string;
  type: string;
  prompt: string;
  choices: string[] | null;
  answerKey: any;
  points: number;
  isOptional: boolean;
  order: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["MCQ", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "CHECKBOX"];

const TYPE_LABELS: Record<string, string> = {
  MCQ: "Multiple Choice",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  CHECKBOX: "Checkbox",
};

function reorder<T extends { id: string }>(
  list: T[],
  index: number,
  direction: -1 | 1
): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const result = [...list];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

// ─── Answer-sheet parser ─────────────────────────────────────────────────────
// Splits pasted text into structured items.  Recognised formats:
//   1. Question text       or   Q1) Question text
//   A) Choice              or   A. Choice   or   (A) Choice
//   Answer: B              or   Correct: A
// If choices are found → MCQ; otherwise → SHORT_ANSWER.

function parseAnswerSheet(text: string) {
  const lines = text.split("\n");
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(?:Q?\d+)\s*[.)]\s/i.test(trimmed)) {
      if (current.length > 0) blocks.push(current);
      current = [trimmed];
    } else if (trimmed) {
      current.push(trimmed);
    }
  }
  if (current.length > 0) blocks.push(current);

  return blocks
    .map((block) => {
      const prompt = block[0].replace(/^(?:Q?\d+)\s*[.)]\s*/i, "").trim();
      if (!prompt) return null;

      const choices: string[] = [];
      let answerIdx = -1;

      for (let i = 1; i < block.length; i++) {
        const line = block[i];
        const choiceMatch = line.match(/^\(?([A-Da-d])\)?\s*[.):]?\s*(.*)/);
        if (choiceMatch && choiceMatch[2]) {
          choices.push(choiceMatch[2].trim());
          continue;
        }
        const answerMatch = line.match(
          /^(?:answer|correct\s*answer|ans)\s*:?\s*\(?([A-Da-d])\)?/i
        );
        if (answerMatch) {
          answerIdx =
            answerMatch[1].toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
        }
      }

      if (choices.length >= 2) {
        return {
          type: "MCQ" as const,
          prompt,
          choices,
          answerKey: answerIdx >= 0 ? { correct: [answerIdx] } : { correct: [] },
          points: 1,
        };
      }
      return {
        type: "SHORT_ANSWER" as const,
        prompt,
        choices: null,
        answerKey: { patterns: [] },
        points: 1,
      };
    })
    .filter(Boolean) as Array<{
      type: string;
      prompt: string;
      choices: string[] | null;
      answerKey: any;
      points: number;
    }>;
}

// ─── Item Editor ─────────────────────────────────────────────────────────────

function ItemEditor({
  item,
  onChange,
  onReorder,
  onDelete,
  isFirst,
  isLast,
}: {
  item: ItemData;
  onChange: (updated: ItemData) => void;
  onReorder: (dir: -1 | 1) => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = item.id === "new"
        ? await fetch("/api/admin/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId: (item as any).lessonId,
              type: item.type,
              prompt: item.prompt,
              choices: item.choices,
              answerKey: item.answerKey,
              points: item.points,
              isOptional: item.isOptional,
            }),
          })
        : await fetch(`/api/admin/items/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: item.type,
              prompt: item.prompt,
              choices: item.choices,
              answerKey: item.answerKey,
              points: item.points,
              isOptional: item.isOptional,
            }),
          });

      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      onChange({ ...item, ...saved });
    } catch (e) {
      setError("Save failed — try again");
    } finally {
      setSaving(false);
    }
  }, [item, onChange]);

  const handleTypeChange = (newType: string) => {
    let choices: string[] | null = null;
    let answerKey: any = {};

    if (newType === "MCQ") {
      choices = ["Choice A", "Choice B", "Choice C", "Choice D"];
      answerKey = { correct: [0] };
    } else if (newType === "TRUE_FALSE") {
      choices = ["True", "False"];
      answerKey = { correct: [0] };
    } else if (newType === "SHORT_ANSWER") {
      answerKey = { patterns: [""] };
    }

    onChange({ ...item, type: newType, choices, answerKey });
  };

  const addChoice = () => {
    onChange({
      ...item,
      choices: [...(item.choices || []), `Choice ${(item.choices?.length || 0) + 1}`],
    });
  };

  const updateChoice = (idx: number, val: string) => {
    const choices = [...(item.choices || [])];
    choices[idx] = val;
    onChange({ ...item, choices });
  };

  const removeChoice = (idx: number) => {
    const choices = (item.choices || []).filter((_, i) => i !== idx);
    // Also remove this index from correct if present
    const correct = (item.answerKey?.correct || []).filter((c: number) => c !== idx).map((c: number) => c > idx ? c - 1 : c);
    onChange({ ...item, choices, answerKey: { ...item.answerKey, correct } });
  };

  const toggleCorrect = (idx: number) => {
    const correct: number[] = item.answerKey?.correct || [];
    const newCorrect = correct.includes(idx)
      ? correct.filter((c) => c !== idx)
      : [...correct, idx];
    onChange({ ...item, answerKey: { ...item.answerKey, correct: newCorrect } });
  };

  const updatePattern = (idx: number, val: string) => {
    const patterns = [...(item.answerKey?.patterns || [])];
    patterns[idx] = val;
    onChange({ ...item, answerKey: { ...item.answerKey, patterns } });
  };

  const addPattern = () => {
    const patterns = [...(item.answerKey?.patterns || []), ""];
    onChange({ ...item, answerKey: { ...item.answerKey, patterns } });
  };

  const removePattern = (idx: number) => {
    const patterns = (item.answerKey?.patterns || []).filter((_: any, i: number) => i !== idx);
    onChange({ ...item, answerKey: { ...item.answerKey, patterns } });
  };

  return (
    <div className="border rounded-lg p-3 bg-background space-y-3">
      {/* Header row: type selector + reorder + delete */}
      <div className="flex items-center gap-2">
        <select
          value={item.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-background text-foreground"
        >
          {ITEM_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-1">
          {item.points} pt{item.points !== 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onReorder(-1)} disabled={isFirst}>
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onReorder(1)} disabled={isLast}>
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Prompt */}
      <textarea
        value={item.prompt}
        onChange={(e) => onChange({ ...item, prompt: e.target.value })}
        placeholder="Question or prompt…"
        rows={2}
        className="w-full border rounded px-2 py-1.5 text-sm resize-none bg-background text-foreground"
      />

      {/* Points */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">Points</label>
        <input
          type="number"
          min={0}
          value={item.points}
          onChange={(e) => onChange({ ...item, points: parseInt(e.target.value) || 0 })}
          className="border rounded px-2 py-1 text-sm w-16 bg-background text-foreground"
        />
        {item.type === "CHECKBOX" && (
          <label className="flex items-center gap-1.5 ml-4 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={item.isOptional}
              onChange={(e) => onChange({ ...item, isOptional: e.target.checked })}
            />
            Optional
          </label>
        )}
      </div>

      {/* Choices editor (MCQ / TRUE_FALSE) */}
      {(item.type === "MCQ" || item.type === "TRUE_FALSE") && item.choices && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Choices — check to mark correct</p>
          {item.choices.map((choice, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(item.answerKey?.correct || []).includes(idx)}
                onChange={() => toggleCorrect(idx)}
              />
              <input
                type="text"
                value={choice}
                onChange={(e) => updateChoice(idx, e.target.value)}
                disabled={item.type === "TRUE_FALSE"}
                className="border rounded px-2 py-0.5 text-sm flex-1 bg-background text-foreground disabled:bg-muted disabled:text-muted-foreground"
              />
              {item.type === "MCQ" && item.choices!.length > 2 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => removeChoice(idx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {item.type === "MCQ" && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={addChoice}>
              <Plus className="h-3 w-3 mr-1" /> Add choice
            </Button>
          )}
        </div>
      )}

      {/* Patterns editor (SHORT_ANSWER) */}
      {item.type === "SHORT_ANSWER" && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Answer patterns (exact text or /regex/)</p>
          {(item.answerKey?.patterns || []).map((pattern: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={pattern}
                onChange={(e) => updatePattern(idx, e.target.value)}
                placeholder="e.g. photosynthesis or /photo.*/i"
                className="border rounded px-2 py-0.5 text-sm flex-1 bg-background text-foreground"
              />
              {(item.answerKey?.patterns || []).length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => removePattern(idx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={addPattern}>
            <Plus className="h-3 w-3 mr-1" /> Add pattern
          </Button>
        </div>
      )}

      {/* Save / error */}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button size="sm" className="h-7 px-3" onClick={handleSave} disabled={saving}>
          <Save className="h-3 w-3 mr-1" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

// ─── Course Editor ───────────────────────────────────────────────────────────

export function CourseEditor({ curriculum }: { curriculum: CurriculumData }) {
  const [units, setUnits] = useState<UnitData[]>(curriculum.units);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(
    () => new Set(curriculum.units.map((u) => u.id))
  );
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(
    () => new Set(curriculum.units.flatMap((u) => u.lessons.map((l) => l.id)))
  );
  const [pasteTarget, setPasteTarget] = useState<string | null>(null); // lessonId
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);

  // APS subject settings
  const [apsSubject, setApsSubject] = useState<string>(curriculum.apsSubject ?? "");
  const [apsSaving, setApsSaving] = useState(false);
  const [apsSaved, setApsSaved] = useState(false);

  const saveApsSubject = async (value: string) => {
    setApsSaving(true);
    setApsSaved(false);
    try {
      await fetch("/api/admin/curricula", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: curriculum.id, apsSubject: value || null }),
      });
      setApsSaved(true);
      setTimeout(() => setApsSaved(false), 2000);
    } finally {
      setApsSaving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  const toggleExpand = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  // ── Unit CRUD ───────────────────────────────────────────────────────────

  const addUnit = async () => {
    const res = await fetch("/api/admin/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curriculumId: curriculum.id, title: "New Unit" }),
    });
    if (res.ok) {
      const unit = await res.json();
      setUnits((prev) => [...prev, { ...unit, lessons: [] }]);
      setExpandedUnits((prev) => toggleExpand(prev, unit.id));
    }
  };

  const reorderUnits = async (index: number, dir: -1 | 1) => {
    const reordered = reorder(units, index, dir);
    setUnits(reordered);
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "unit", orderedIds: reordered.map((u) => u.id) }),
    });
  };

  const deleteUnit = async (unitId: string) => {
    if (!confirm("Delete this unit and all its lessons and items?")) return;
    const res = await fetch(`/api/admin/units/${unitId}`, { method: "DELETE" });
    if (res.ok) setUnits((prev) => prev.filter((u) => u.id !== unitId));
  };

  const saveUnit = async (unit: UnitData) => {
    await fetch(`/api/admin/units/${unit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: unit.title, description: unit.description }),
    });
  };

  const updateUnit = (unitId: string, patch: Partial<UnitData>) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, ...patch } : u))
    );
  };

  // ── Lesson CRUD ─────────────────────────────────────────────────────────

  const addLesson = async (unitId: string) => {
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId, title: "New Lesson", contentMd: "" }),
    });
    if (res.ok) {
      const lesson = await res.json();
      updateUnit(unitId, {
        lessons: [
          ...(units.find((u) => u.id === unitId)?.lessons || []),
          { ...lesson, items: [] },
        ],
      });
      setExpandedLessons((prev) => toggleExpand(prev, lesson.id));
    }
  };

  const reorderLessons = async (unitId: string, index: number, dir: -1 | 1) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit) return;
    const reordered = reorder(unit.lessons, index, dir);
    updateUnit(unitId, { lessons: reordered });
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "lesson", orderedIds: reordered.map((l) => l.id) }),
    });
  };

  const deleteLesson = async (unitId: string, lessonId: string) => {
    if (!confirm("Delete this lesson and all its items?")) return;
    const res = await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
    if (res.ok) {
      const unit = units.find((u) => u.id === unitId);
      if (unit) updateUnit(unitId, { lessons: unit.lessons.filter((l) => l.id !== lessonId) });
    }
  };

  const saveLesson = async (lesson: LessonData) => {
    await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: lesson.title,
        description: lesson.description,
        contentMd: lesson.contentMd,
        threshold: lesson.threshold,
        objectives: lesson.objectives,
        attachmentUrl: lesson.attachmentUrl ?? null,
      }),
    });
  };

  const updateLesson = (unitId: string, lessonId: string, patch: Partial<LessonData>) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? { ...u, lessons: u.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)) }
          : u
      )
    );
  };

  // ── Item CRUD ───────────────────────────────────────────────────────────

  const addItem = async (unitId: string, lessonId: string) => {
    const res = await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        type: "MCQ",
        prompt: "",
        choices: ["Choice A", "Choice B", "Choice C", "Choice D"],
        answerKey: { correct: [0] },
        points: 1,
      }),
    });
    if (res.ok) {
      const item = await res.json();
      const lesson = units.find((u) => u.id === unitId)?.lessons.find((l) => l.id === lessonId);
      if (lesson) updateLesson(unitId, lessonId, { items: [...lesson.items, item] });
    }
  };

  const reorderItems = async (unitId: string, lessonId: string, index: number, dir: -1 | 1) => {
    const lesson = units.find((u) => u.id === unitId)?.lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    const reordered = reorder(lesson.items, index, dir);
    updateLesson(unitId, lessonId, { items: reordered });
    await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", orderedIds: reordered.map((i) => i.id) }),
    });
  };

  const deleteItem = async (unitId: string, lessonId: string, itemId: string) => {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      const lesson = units.find((u) => u.id === unitId)?.lessons.find((l) => l.id === lessonId);
      if (lesson) updateLesson(unitId, lessonId, { items: lesson.items.filter((i) => i.id !== itemId) });
    }
  };

  const updateItem = (unitId: string, lessonId: string, itemId: string, updated: ItemData) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? {
              ...u,
              lessons: u.lessons.map((l) =>
                l.id === lessonId
                  ? { ...l, items: l.items.map((i) => (i.id === itemId ? updated : i)) }
                  : l
              ),
            }
          : u
      )
    );
  };

  // ── Paste answer sheet ─────────────────────────────────────────────────

  const importFromText = async (unitId: string, lessonId: string) => {
    setImporting(true);
    const parsed = parseAnswerSheet(pasteText);
    const newItems: ItemData[] = [];
    for (const p of parsed) {
      const res = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, ...p }),
      });
      if (res.ok) newItems.push(await res.json());
    }
    if (newItems.length > 0) {
      const lesson = units
        .find((u) => u.id === unitId)
        ?.lessons.find((l) => l.id === lessonId);
      if (lesson)
        updateLesson(unitId, lessonId, { items: [...lesson.items, ...newItems] });
    }
    setPasteText("");
    setPasteTarget(null);
    setImporting(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* APS Subject Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">APS Monthly Report Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-sm">
                APS Subject Category
              </Label>
              <p className="text-xs text-muted-foreground">
                Set which APS subject row this curriculum's hours appear under in the monthly report. Overrides keyword matching.
              </p>
              <Select
                value={apsSubject || "__none__"}
                onValueChange={(val) => {
                  const v = val === "__none__" ? "" : val;
                  setApsSubject(v);
                  saveApsSubject(v);
                }}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Auto-detect from name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Auto-detect from name</SelectItem>
                  {APS_SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground pb-1">
              {apsSaving && <span>Saving…</span>}
              {apsSaved && !apsSaving && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {units.map((unit, unitIdx) => {
        const isUnitExpanded = expandedUnits.has(unit.id);
        return (
          <Card key={unit.id}>
            {/* Unit header */}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedUnits((prev) => toggleExpand(prev, unit.id))}
                >
                  {isUnitExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <BookOpen className="h-4 w-4 text-primary" />
                <input
                  type="text"
                  value={unit.title}
                  onChange={(e) => updateUnit(unit.id, { title: e.target.value })}
                  className="font-semibold text-base border-b border-transparent hover:border-muted focus:border-primary focus:outline-none flex-1"
                />
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => reorderUnits(unitIdx, -1)} disabled={unitIdx === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => reorderUnits(unitIdx, 1)} disabled={unitIdx === units.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteUnit(unit.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Unit description + save */}
              <div className="flex items-end gap-2 mt-2 ml-6">
                <input
                  type="text"
                  value={unit.description || ""}
                  onChange={(e) => updateUnit(unit.id, { description: e.target.value || null })}
                  placeholder="Unit description…"
                  className="text-sm text-muted-foreground border-b border-transparent hover:border-muted focus:border-primary focus:outline-none flex-1"
                />
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => saveUnit(unit)}>
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </CardHeader>

            {/* Unit body — lessons */}
            {isUnitExpanded && (
              <CardContent className="pt-0 space-y-3">
                {unit.lessons.map((lesson, lessonIdx) => {
                  const isLessonExpanded = expandedLessons.has(lesson.id);
                  return (
                    <div key={lesson.id} className="border rounded-lg p-3 space-y-2">
                      {/* Lesson header */}
                      <div className="flex items-center gap-2">
                        <button
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setExpandedLessons((prev) => toggleExpand(prev, lesson.id))}
                        >
                          {isLessonExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(unit.id, lesson.id, { title: e.target.value })}
                          className="font-medium text-sm border-b border-transparent hover:border-muted focus:border-primary focus:outline-none flex-1"
                        />
                        <Badge variant="secondary" className="text-xs">≥{lesson.threshold}%</Badge>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => reorderLessons(unit.id, lessonIdx, -1)} disabled={lessonIdx === 0}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => reorderLessons(unit.id, lessonIdx, 1)} disabled={lessonIdx === unit.lessons.length - 1}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteLesson(unit.id, lesson.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Lesson expanded body */}
                      {isLessonExpanded && (
                        <div className="space-y-3 ml-4">
                          {/* Lesson fields */}
                          <div className="flex gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-muted-foreground">Threshold</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={lesson.threshold}
                                onChange={(e) => updateLesson(unit.id, lesson.id, { threshold: parseInt(e.target.value) || 0 })}
                                className="border rounded px-2 py-0.5 text-sm w-16 bg-background text-foreground"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          </div>

                          {/* Description */}
                          <input
                            type="text"
                            value={lesson.description || ""}
                            onChange={(e) => updateLesson(unit.id, lesson.id, { description: e.target.value || null })}
                            placeholder="Lesson description…"
                            className="w-full text-sm text-muted-foreground border-b border-transparent hover:border-muted focus:border-primary focus:outline-none"
                          />

                          {/* Content (markdown) */}
                          <div>
                            <label className="text-xs text-muted-foreground">Lesson Content (Markdown)</label>
                            <textarea
                              value={lesson.contentMd}
                              onChange={(e) => updateLesson(unit.id, lesson.id, { contentMd: e.target.value })}
                              rows={4}
                              placeholder="Write lesson content in markdown…"
                              className="w-full border rounded px-2 py-1.5 text-sm resize-y mt-1 bg-background text-foreground"
                            />
                          </div>

                          {/* PDF attachment */}
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            {lesson.attachmentUrl ? (
                              <>
                                <a
                                  href={lesson.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary underline"
                                >
                                  Attached PDF
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-xs text-muted-foreground hover:text-red-500"
                                  onClick={async () => {
                                    await fetch(`/api/admin/lessons/${lesson.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ attachmentUrl: null }),
                                    });
                                    updateLesson(unit.id, lesson.id, { attachmentUrl: null });
                                  }}
                                >
                                  Remove
                                </Button>
                              </>
                            ) : (
                              <UploadButton
                                endpoint="lessonAttachment"
                                onClientUploadComplete={(res: any) => {
                                  if (res?.[0]?.url) {
                                    const url = res[0].url;
                                    fetch(`/api/admin/lessons/${lesson.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ attachmentUrl: url }),
                                    });
                                    updateLesson(unit.id, lesson.id, { attachmentUrl: url });
                                  }
                                }}
                                onUploadError={(error: Error) => {
                                  console.error("Upload failed:", error);
                                }}
                                className="ut-button:h-7 ut-button:px-2.5 ut-button:text-xs ut-button:bg-muted ut-button:text-foreground ut-button:hover:bg-muted/80 ut-allowed-types:text-xs ut-allowed-types:text-muted-foreground"
                              />
                            )}
                          </div>

                          {/* Save lesson */}
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="h-7 px-3" onClick={() => saveLesson(lesson)}>
                              <Save className="h-3 w-3 mr-1" /> Save Lesson
                            </Button>
                          </div>

                          {/* Items */}
                          <div className="space-y-2">
                            {lesson.items.map((item, itemIdx) => (
                              <ItemEditor
                                key={item.id}
                                item={item}
                                isFirst={itemIdx === 0}
                                isLast={itemIdx === lesson.items.length - 1}
                                onChange={(updated) => updateItem(unit.id, lesson.id, item.id, updated)}
                                onReorder={(dir) => reorderItems(unit.id, lesson.id, itemIdx, dir)}
                                onDelete={() => deleteItem(unit.id, lesson.id, item.id)}
                              />
                            ))}
                          </div>

                          {/* Add item / paste answer sheet */}
                          {pasteTarget === lesson.id ? (
                            <div className="border rounded-lg p-3 bg-background space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Paste answer sheet — questions are auto-detected
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setPasteTarget(null);
                                    setPasteText("");
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <textarea
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                autoFocus
                                placeholder={[
                                  "1. What is photosynthesis?",
                                  "A) Process of converting light…",
                                  "B) Breakdown of glucose…",
                                  "Answer: A",
                                  "",
                                  "2. Next question…",
                                ].join("\n")}
                                rows={8}
                                className="w-full border rounded px-2 py-1.5 text-sm resize-y bg-background text-foreground"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    importFromText(unit.id, lesson.id)
                                  }
                                  disabled={
                                    importing || !pasteText.trim()
                                  }
                                >
                                  {importing
                                    ? "Importing…"
                                    : `Import ${parseAnswerSheet(pasteText).length} item${parseAnswerSheet(pasteText).length !== 1 ? "s" : ""}`}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPasteTarget(null);
                                    setPasteText("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs border-dashed"
                                onClick={() => addItem(unit.id, lesson.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Item
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-dashed"
                                onClick={() => setPasteTarget(lesson.id)}
                              >
                                <ClipboardList className="h-3 w-3 mr-1" /> Paste
                                Sheet
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add lesson */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs border-dashed"
                  onClick={() => addLesson(unit.id)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Lesson
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add unit */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-9"
        onClick={addUnit}
      >
        <Plus className="h-4 w-4 mr-2" /> Add Unit
      </Button>
    </div>
  );
}
