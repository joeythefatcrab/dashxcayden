"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, Loader2, FileText, CheckCircle2, XCircle,
  BookOpen, PenLine, CheckSquare, Sparkles, AlertCircle, ClipboardPaste,
} from "lucide-react";

type ParsedChecklistItem = {
  tempId: string;
  sectionTitle: string;
  title: string;
  description: string;
  itemType: "CHECKBOX" | "ESSAY" | "COURSE_LINK";
  isOptional: boolean;
  requiresReview: boolean;
  suggestedCurriculumId?: string;
  suggestedCurriculumName?: string;
  selectedCurriculumId?: string;
  skip?: boolean;
};

type Section = { title: string; items: ParsedChecklistItem[] };
type Curriculum = { id: string; name: string; subject: string | null };

const TYPE_META = {
  CHECKBOX:    { label: "Checkbox",     icon: <CheckSquare className="h-3 w-3" />, color: "bg-gray-100 text-gray-700" },
  ESSAY:       { label: "Essay",        icon: <PenLine className="h-3 w-3" />,     color: "bg-blue-100 text-blue-700" },
  COURSE_LINK: { label: "Course",       icon: <BookOpen className="h-3 w-3" />,    color: "bg-purple-100 text-purple-700" },
};

export function ProgramPDFImport({ programId }: { programId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [inputMode, setInputMode] = useState<"pdf" | "paste">("pdf");
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [importResult, setImportResult] = useState<{ checklistAdded: number; coursesAdded: number; skipped: number } | null>(null);

  const updateItem = (tempId: string, patch: Partial<ParsedChecklistItem>) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)),
      }))
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setParsing(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/programs/parse-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to parse PDF"); return; }
      setSections(data.sections || []);
      setCurricula(data.curricula || []);
      setStep("review");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setError(null);
    setParsing(true);
    try {
      const res = await fetch("/api/admin/programs/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to parse text"); return; }
      setSections(data.sections || []);
      setCurricula(data.curricula || []);
      setStep("review");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/import-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
      setStep("done");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const totalActive = sections.reduce((n, s) => n + s.items.filter((i) => !i.skip).length, 0);
  const missingCurriculum = sections.reduce(
    (n, s) => n + s.items.filter((i) => !i.skip && i.itemType === "COURSE_LINK" && !i.selectedCurriculumId).length,
    0
  );

  // ── Done ─────────────────────────────────────────────────────────────────
  if (step === "done" && importResult) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-10">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold">Import Complete!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            <strong>{importResult.checklistAdded}</strong> checklist items added
            {importResult.coursesAdded > 0 && <> · <strong>{importResult.coursesAdded}</strong> courses linked</>}
            {importResult.skipped > 0 && <> · {importResult.skipped} skipped</>}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { setStep("upload"); setSections([]); setImportResult(null); }}>
            Import Another PDF
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  if (step === "review") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review Extracted Checklist
          </CardTitle>
          <CardDescription>
            {totalActive} items across {sections.length} sections.
            {missingCurriculum > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                {missingCurriculum} course{missingCurriculum !== 1 ? "s" : ""} need a curriculum match.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          {sections.map((section, si) => (
            <div key={si}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const meta = TYPE_META[item.itemType];
                  return (
                    <div key={item.tempId} className={`rounded-lg border p-3 space-y-2 transition-opacity ${item.skip ? "opacity-40" : ""}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              value={item.title}
                              onChange={(e) => updateItem(item.tempId, { title: e.target.value })}
                              className="h-7 text-sm font-medium flex-1 min-w-[180px]"
                              disabled={item.skip}
                            />
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                              {meta.icon}{meta.label}
                            </span>
                            {item.isOptional && <Badge variant="outline" className="text-xs h-5">Optional</Badge>}
                            {item.requiresReview && <Badge variant="outline" className="text-xs h-5 border-blue-300 text-blue-700">Sent to Admin</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Select
                            value={item.itemType}
                            onValueChange={(v) => updateItem(item.tempId, { itemType: v as any, selectedCurriculumId: "" })}
                            disabled={item.skip}
                          >
                            <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CHECKBOX" className="text-xs">Checkbox</SelectItem>
                              <SelectItem value="ESSAY" className="text-xs">Essay</SelectItem>
                              <SelectItem value="COURSE_LINK" className="text-xs">Course</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                            onClick={() => updateItem(item.tempId, { skip: !item.skip })}
                            title={item.skip ? "Include" : "Skip"}>
                            {item.skip ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {item.itemType === "COURSE_LINK" && !item.skip && (
                        <div className="flex items-center gap-2 pl-1">
                          <Label className="text-xs text-muted-foreground shrink-0">Link to curriculum:</Label>
                          <Select
                            value={item.selectedCurriculumId || "__none__"}
                            onValueChange={(v) => updateItem(item.tempId, { selectedCurriculumId: v === "__none__" ? "" : v })}
                          >
                            <SelectTrigger className={`h-7 text-xs flex-1 ${!item.selectedCurriculumId ? "border-amber-300" : ""}`}>
                              <SelectValue placeholder="Select curriculum..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__" className="text-xs text-muted-foreground">— None / checklist only —</SelectItem>
                              {curricula.map((c) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.name}{c.subject ? ` (${c.subject})` : ""}
                                  {c.id === item.suggestedCurriculumId ? " ✨" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.selectedCurriculumId === item.suggestedCurriculumId && item.suggestedCurriculumId && (
                            <span className="text-xs text-muted-foreground shrink-0">✨ auto-matched</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="outline" onClick={() => setStep("upload")}>← Back</Button>
            <Button onClick={handleImport} disabled={importing || totalActive === 0} className="gap-2">
              {importing ? <><Loader2 className="h-4 w-4 animate-spin" />Importing...</> : <>Import {totalActive} items into Program</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Import Checklist
        </CardTitle>
        <CardDescription>
          Upload a PDF or paste your checklist text. AI extracts every section and item automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-lg border p-1 w-fit">
          <button
            onClick={() => setInputMode("pdf")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${inputMode === "pdf" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Upload className="h-3.5 w-3.5" />Upload PDF
          </button>
          <button
            onClick={() => setInputMode("paste")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${inputMode === "paste" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />Paste Text
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {inputMode === "paste" ? (
          <div className="space-y-3">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Paste your checklist here…\n\nExample:\nEnglish\n________Student read 20 books.\n________Submitted final essay.\n\nMathematics\n________Completed math workbook."}
              rows={14}
              className="font-mono text-sm"
              disabled={parsing}
            />
            <Button
              onClick={handlePasteSubmit}
              disabled={parsing || !pasteText.trim()}
              className="w-full gap-2"
            >
              {parsing
                ? <><Loader2 className="h-4 w-4 animate-spin" />Parsing…</>
                : <><Sparkles className="h-4 w-4" />Parse Checklist</>}
            </Button>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${parsing ? "opacity-60 pointer-events-none" : "hover:border-primary/50 hover:bg-muted/30"}`}>
            <input ref={fileRef} type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} disabled={parsing} />
            {parsing ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Parsing PDF…</p>
                  <p className="text-sm text-muted-foreground">AI is reading your program document</p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Click to upload your yearly program PDF</p>
                  <p className="text-sm text-muted-foreground">Sections, checkboxes, essays, and courses detected automatically</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); fileRef.current?.click(); }}>
                  Choose File
                </Button>
              </>
            )}
          </label>
        )}
      </CardContent>
    </Card>
  );
}
