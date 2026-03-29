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
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  BookOpen,
  Heart,
  MapPin,
  Wrench,
  BookMarked,
  Dumbbell,
  HelpCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";

type ParsedItem = {
  tempId: string;
  rawTitle: string;
  title: string;
  description: string;
  type: "COURSE" | "VOLUNTEERING" | "FIELD_TRIP" | "PRACTICAL" | "READING" | "PE" | "OTHER";
  hoursRequired?: number;
  suggestedCurriculumId?: string;
  suggestedCurriculumName?: string;
  selectedCurriculumId?: string;
  skip?: boolean;
};

type Curriculum = { id: string; name: string; subject: string | null };

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  COURSE:       { label: "Course",       icon: <BookOpen className="h-3.5 w-3.5" />,   color: "bg-blue-100 text-blue-800" },
  VOLUNTEERING: { label: "Volunteering", icon: <Heart className="h-3.5 w-3.5" />,       color: "bg-pink-100 text-pink-800" },
  FIELD_TRIP:   { label: "Field Trip",   icon: <MapPin className="h-3.5 w-3.5" />,      color: "bg-amber-100 text-amber-800" },
  PRACTICAL:    { label: "Practical",    icon: <Wrench className="h-3.5 w-3.5" />,      color: "bg-orange-100 text-orange-800" },
  READING:      { label: "Reading",      icon: <BookMarked className="h-3.5 w-3.5" />,  color: "bg-purple-100 text-purple-800" },
  PE:           { label: "PE",           icon: <Dumbbell className="h-3.5 w-3.5" />,    color: "bg-green-100 text-green-800" },
  OTHER:        { label: "Other",        icon: <HelpCircle className="h-3.5 w-3.5" />,  color: "bg-gray-100 text-gray-600" },
};

interface Props {
  programId: string;
}

export function ProgramPDFImport({ programId }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [importResult, setImportResult] = useState<{ coursesAdded: number; activitiesAdded: number; skipped: number } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setParsing(true);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/programs/parse-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setParseError(data.error || "Failed to parse PDF");
        return;
      }
      // Pre-select suggested curriculum where available
      const preSelected = (data.items as ParsedItem[]).map((item) => ({
        ...item,
        selectedCurriculumId: item.suggestedCurriculumId || "",
      }));
      setItems(preSelected);
      setCurricula(data.curricula || []);
      setStep("review");
    } catch (err) {
      setParseError("Network error — please try again.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateItem = (tempId: string, patch: Partial<ParsedItem>) => {
    setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)));
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/import-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
      setStep("done");
      router.refresh();
    } catch (err: any) {
      setParseError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const activeCount = items.filter((i) => !i.skip).length;
  const coursesMissingCurriculum = items.filter(
    (i) => !i.skip && i.type === "COURSE" && !i.selectedCurriculumId
  ).length;

  if (step === "done" && importResult) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Import Complete!</h3>
            <p className="text-sm text-muted-foreground">
              Added <strong>{importResult.coursesAdded}</strong> course{importResult.coursesAdded !== 1 ? "s" : ""}
              {importResult.activitiesAdded > 0 && <> and <strong>{importResult.activitiesAdded}</strong> activities</>}
              {importResult.skipped > 0 && <> · {importResult.skipped} skipped</>}
            </p>
            <Button variant="outline" onClick={() => { setStep("upload"); setItems([]); setImportResult(null); }}>
              Import Another PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "review") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review Extracted Items
          </CardTitle>
          <CardDescription>
            {items.length} items found. Match courses to your existing curricula, then click Import.
            {coursesMissingCurriculum > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                {coursesMissingCurriculum} course{coursesMissingCurriculum !== 1 ? "s" : ""} need a curriculum match.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {parseError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}

          {items.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.OTHER;
            return (
              <div
                key={item.tempId}
                className={`rounded-lg border p-3 space-y-2 transition-opacity ${item.skip ? "opacity-40" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        value={item.title}
                        onChange={(e) => updateItem(item.tempId, { title: e.target.value })}
                        className="h-7 text-sm font-medium w-auto flex-1 min-w-[160px]"
                        disabled={item.skip}
                      />
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Type selector */}
                    <Select
                      value={item.type}
                      onValueChange={(v) => updateItem(item.tempId, { type: v as ParsedItem["type"], selectedCurriculumId: "" })}
                      disabled={item.skip}
                    >
                      <SelectTrigger className="h-7 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_META).map(([val, m]) => (
                          <SelectItem key={val} value={val} className="text-xs">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => updateItem(item.tempId, { skip: !item.skip })}
                      title={item.skip ? "Include" : "Skip"}
                    >
                      {item.skip ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Curriculum matcher — only for COURSE type */}
                {item.type === "COURSE" && !item.skip && (
                  <div className="flex items-center gap-2 pl-1">
                    <Label className="text-xs text-muted-foreground shrink-0">Match to curriculum:</Label>
                    <Select
                      value={item.selectedCurriculumId || ""}
                      onValueChange={(v) => updateItem(item.tempId, { selectedCurriculumId: v })}
                    >
                      <SelectTrigger className={`h-7 text-xs flex-1 ${!item.selectedCurriculumId ? "border-amber-300" : ""}`}>
                        <SelectValue placeholder="Select curriculum..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="" className="text-xs text-muted-foreground">— No match / skip —</SelectItem>
                        {curricula.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}{c.subject ? ` (${c.subject})` : ""}
                            {c.id === item.suggestedCurriculumId && " ✨"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {item.suggestedCurriculumId && item.selectedCurriculumId === item.suggestedCurriculumId && (
                      <span className="text-xs text-muted-foreground shrink-0">✨ auto-matched</span>
                    )}
                  </div>
                )}

                {/* Hours field for activities */}
                {item.type !== "COURSE" && !item.skip && (
                  <div className="flex items-center gap-2 pl-1">
                    <Label className="text-xs text-muted-foreground shrink-0">Hours required:</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={item.hoursRequired ?? ""}
                      onChange={(e) => updateItem(item.tempId, { hoursRequired: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="h-7 w-24 text-xs"
                      placeholder="optional"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => setStep("upload")}>← Back</Button>
            <Button
              onClick={handleImport}
              disabled={importing || activeCount === 0}
              className="gap-2"
            >
              {importing ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Importing...</>
              ) : (
                <>Import {activeCount} item{activeCount !== 1 ? "s" : ""} into Program</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Upload step
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Import from PDF
        </CardTitle>
        <CardDescription>
          Upload your yearly program PDF. We'll extract all courses and activities, match them to existing curricula, and let you review before importing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parseError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {parseError}
          </div>
        )}

        <label
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            parsing ? "opacity-60 pointer-events-none" : "hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={handleFileChange}
            disabled={parsing}
          />
          {parsing ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div>
                <p className="font-medium">Parsing PDF…</p>
                <p className="text-sm text-muted-foreground">Extracting and structuring program items with AI</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Click to upload your program PDF</p>
                <p className="text-sm text-muted-foreground">PDF files only · Analyzed with AI</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); fileRef.current?.click(); }}>
                Choose File
              </Button>
            </>
          )}
        </label>
      </CardContent>
    </Card>
  );
}
