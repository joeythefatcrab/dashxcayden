"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function AdminNotifyToggle({ initialValue }: { initialValue: boolean }) {
  const [checked, setChecked] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  const toggle = async (value: boolean) => {
    setChecked(value);
    setStatus("saving");
    try {
      const res = await fetch("/api/settings/admin-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyOnReportSubmission: value }),
      });
      setStatus(res.ok ? "ok" : "error");
      if (!res.ok) setChecked(!value); // revert
    } catch {
      setStatus("error");
      setChecked(!value);
    }
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Checkbox
          id="notifyReports"
          checked={checked}
          onCheckedChange={(v) => toggle(v as boolean)}
          disabled={status === "saving"}
        />
        <div>
          <Label htmlFor="notifyReports" className="cursor-pointer font-medium">
            Email me when a parent submits a monthly report
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            You'll receive a notification email with an attached HTML file you can open in any browser and print to PDF.
          </p>
        </div>
      </div>
      {status === "ok" && (
        <div className="flex items-center gap-1.5 text-xs text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />Saved
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />Failed to save — please try again
        </div>
      )}
    </div>
  );
}
