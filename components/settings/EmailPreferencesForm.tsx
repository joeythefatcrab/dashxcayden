"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface EmailPreferencesFormProps {
  initialDigestFrequency: string;
  initialNotifyEmail: boolean;
}

export function EmailPreferencesForm({
  initialDigestFrequency,
  initialNotifyEmail,
}: EmailPreferencesFormProps) {
  const router = useRouter();
  const [digestFrequency, setDigestFrequency] = useState(initialDigestFrequency);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/settings/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          digestFrequency,
          notifyEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      setMessage({ type: "success", text: "Preferences updated successfully!" });
      router.refresh();
    } catch (error) {
      console.error("Error updating preferences:", error);
      setMessage({ type: "error", text: "Failed to update preferences. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDigest = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/digest/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: digestFrequency === "none" ? "daily" : digestFrequency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send test digest");
      }

      setMessage({
        type: "success",
        text: "Test digest sent! Check your email in a few moments.",
      });
    } catch (error) {
      console.error("Error sending test digest:", error);
      setMessage({ type: "error", text: "Failed to send test digest. Please try again." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable/Disable Email Notifications */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="notifyEmail"
          checked={notifyEmail}
          onCheckedChange={(checked) => setNotifyEmail(checked as boolean)}
        />
        <Label htmlFor="notifyEmail" className="cursor-pointer">
          Enable email notifications
        </Label>
      </div>

      {/* Digest Frequency */}
      <div className="space-y-3">
        <Label>Digest Frequency</Label>
        <RadioGroup
          value={digestFrequency}
          onValueChange={setDigestFrequency}
          disabled={!notifyEmail}
          className="space-y-3"
        >
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="daily" id="daily" />
            <div className="grid gap-1">
              <Label htmlFor="daily" className="cursor-pointer font-medium">
                Daily
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary every morning at 8 AM
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="weekly" id="weekly" />
            <div className="grid gap-1">
              <Label htmlFor="weekly" className="cursor-pointer font-medium">
                Weekly
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary every Monday morning at 9 AM
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <RadioGroupItem value="none" id="none" />
            <div className="grid gap-1">
              <Label htmlFor="none" className="cursor-pointer font-medium">
                None
              </Label>
              <p className="text-sm text-muted-foreground">
                Don't send me progress digests (you can still access the dashboard anytime)
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>

        {notifyEmail && digestFrequency !== "none" && (
          <Button
            type="button"
            variant="outline"
            onClick={handleTestDigest}
            disabled={isTesting}
          >
            {isTesting ? "Sending..." : "Send Test Email"}
          </Button>
        )}
      </div>
    </form>
  );
}
