"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";

type Props = {
  reportId: string;
  initialNotes?: string;
  onSave?: () => void;
};

export function ParentNotesEditor({ reportId, initialNotes, onSave }: Props) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(notes !== (initialNotes || ""));
  }, [notes, initialNotes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/parent/monthly-report/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          parentNotes: notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setHasChanges(false);
      onSave?.();
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anything you would like to share or need help with?
            </CardTitle>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Example: This month Sarah excelled in mathematics and showed great interest in astronomy. We took a field trip to the Science Center which really sparked her curiosity..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          These notes will be included in the AI-generated report and help provide context for your provider.
        </p>
      </CardContent>
    </Card>
  );
}
