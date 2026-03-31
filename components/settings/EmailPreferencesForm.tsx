"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

export type EmailPrefs = {
  lessonCompletions: boolean;
  scores: boolean;
  checklistUpdates: boolean;
  essayAlerts: boolean;
};

const DEFAULT_PREFS: EmailPrefs = {
  lessonCompletions: true,
  scores: true,
  checklistUpdates: true,
  essayAlerts: true,
};

interface EmailPreferencesFormProps {
  initialDigestFrequency: string;
  initialNotifyEmail: boolean;
  initialEmailPrefsJson?: string;
}

export function EmailPreferencesForm({
  initialDigestFrequency,
  initialNotifyEmail,
  initialEmailPrefsJson,
}: EmailPreferencesFormProps) {
  const router = useRouter();
  const [digestFrequency, setDigestFrequency] = useState(initialDigestFrequency);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail);
  const [prefs, setPrefs] = useState<EmailPrefs>(() => {
    try {
      return { ...DEFAULT_PREFS, ...JSON.parse(initialEmailPrefsJson || "{}") };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const setPref = (key: keyof EmailPrefs, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestFrequency, notifyEmail, emailPrefsJson: JSON.stringify(prefs) }),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      setMessage({ type: "success", text: "Preferences saved!" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDigest = async () => {
    setIsTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/digest/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency: digestFrequency === "none" ? "daily" : digestFrequency }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Test digest sent! Check your email." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send test digest." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error — please try again." });
    } finally {
      setIsTesting(false);
    }
  };

  const CATEGORY_ITEMS: { key: keyof EmailPrefs; label: string; description: string }[] = [
    {
      key: "lessonCompletions",
      label: "Lesson completions",
      description: "How many lessons each child finished in the period",
    },
    {
      key: "scores",
      label: "Scores & performance",
      description: "Average quiz/test scores across courses",
    },
    {
      key: "checklistUpdates",
      label: "Checklist updates",
      description: "Progress on the yearly program checklist",
    },
    {
      key: "essayAlerts",
      label: "Essay submission alerts",
      description: "Immediate email when a student submits an essay for your review",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Master toggle */}
      <div className="flex items-center gap-3">
        <Checkbox
          id="notifyEmail"
          checked={notifyEmail}
          onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
        />
        <div>
          <Label htmlFor="notifyEmail" className="text-sm font-medium cursor-pointer">Enable email notifications</Label>
          <p className="text-xs text-muted-foreground">Receive email updates about your children's progress</p>
        </div>
      </div>

      {notifyEmail && (
        <>
          {/* Digest Frequency */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Digest frequency</Label>
            <RadioGroup value={digestFrequency} onValueChange={setDigestFrequency} className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="daily" id="daily" className="mt-0.5" />
                <div>
                  <Label htmlFor="daily" className="cursor-pointer font-medium">Daily</Label>
                  <p className="text-xs text-muted-foreground">Sent every morning at 8 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="weekly" id="weekly" className="mt-0.5" />
                <div>
                  <Label htmlFor="weekly" className="cursor-pointer font-medium">Weekly</Label>
                  <p className="text-xs text-muted-foreground">Sent every Monday morning at 9 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <RadioGroupItem value="none" id="freq-none" className="mt-0.5" />
                <div>
                  <Label htmlFor="freq-none" className="cursor-pointer font-medium">No digest</Label>
                  <p className="text-xs text-muted-foreground">Don't send periodic summaries (instant alerts still work)</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Per-category toggles */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What to include in emails</Label>
            <div className="space-y-2">
              {CATEGORY_ITEMS.map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Checkbox
                    checked={prefs[key]}
                    onCheckedChange={(v) => setPref(key, v as boolean)}
                    disabled={key === "essayAlerts" ? false : digestFrequency === "none"}
                  />
                </div>
              ))}
            </div>
            {digestFrequency === "none" && (
              <p className="text-xs text-muted-foreground">
                Digest categories are only used when a frequency is selected. Essay alerts are always instant.
              </p>
            )}
          </div>
        </>
      )}

      {/* Status message */}
      {message && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save Preferences"}
        </Button>
        {notifyEmail && digestFrequency !== "none" && (
          <Button type="button" variant="outline" onClick={handleTestDigest} disabled={isTesting}>
            {isTesting ? "Sending…" : "Send Test Email"}
          </Button>
        )}
      </div>
    </form>
  );
}
