"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";


export function NotifyToggle({
  userId,
  initialValue,
  label = "Report emails",
}: {
  userId: string;
  initialValue: boolean;
  label?: string;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    const next = !enabled;
    try {
      const res = await fetch("/api/admin/user-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, notifyOnReportSubmission: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Checkbox id={`notify-${userId}`} checked={enabled} onCheckedChange={toggle} />
      )}
      <Label htmlFor={`notify-${userId}`} className="text-xs text-muted-foreground cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
