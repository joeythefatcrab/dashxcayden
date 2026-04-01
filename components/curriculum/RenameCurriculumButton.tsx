"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  curriculumId: string;
  currentName: string;
  currentDescription?: string | null;
}

export function RenameCurriculumButton({ curriculumId, currentName, currentDescription }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleOpen = () => {
    setName(currentName);
    setDescription(currentDescription ?? "");
    setError("");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Name cannot be empty"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/curricula", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: curriculumId, name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Rename"
        className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Curriculum</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label htmlFor="rename-name">Name</Label>
              <Input
                id="rename-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rename-desc">Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="rename-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Save</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
