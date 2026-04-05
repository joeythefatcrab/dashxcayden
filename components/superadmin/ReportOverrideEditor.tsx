"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";

type Props = {
  reportId: string;
  label: string;
  submittedAt: string;
  initialOverride: Record<string, any> | null;
};

export function ReportOverrideEditor({ reportId, label, submittedAt, initialOverride }: Props) {
  const [value, setValue] = useState(
    initialOverride ? JSON.stringify(initialOverride, null, 2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [parseError, setParseError] = useState<string | null>(null);

  const save = async () => {
    setParseError(null);
    let parsed: Record<string, any> | null = null;
    if (value.trim()) {
      try {
        parsed = JSON.parse(value);
      } catch {
        setParseError("Invalid JSON");
        return;
      }
    }
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/superadmin/reports/${reportId}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override: parsed }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setValue("");
    setParseError(null);
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/superadmin/reports/${reportId}/override`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override: null }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{label}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted {new Date(submittedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {initialOverride && (
              <Badge variant="secondary" className="text-xs">Override active</Badge>
            )}
            <a
              href={`/api/reports/${reportId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Preview PDF <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          className="font-mono text-xs min-h-[120px]"
          placeholder={'{\n  "attendanceSummary": { "present": 20 },\n  "report": { "educatorEvaluation": { ... } }\n}'}
          value={value}
          onChange={(e) => { setValue(e.target.value); setStatus("idle"); setParseError(null); }}
        />
        {parseError && <p className="text-xs text-destructive">{parseError}</p>}
        {status === "saved" && <p className="text-xs text-green-600">Saved — PDF will use this override.</p>}
        {status === "error" && <p className="text-xs text-destructive">Save failed.</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save Override
          </Button>
          {value.trim() && (
            <Button size="sm" variant="outline" onClick={clear} disabled={saving}>
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
