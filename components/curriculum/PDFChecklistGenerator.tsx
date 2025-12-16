"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Upload, Loader2, CheckCircle } from "lucide-react";
import { CurriculumPreview } from "./CurriculumPreview";

export function PDFChecklistGenerator() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");

  const [previewCurriculum, setPreviewCurriculum] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      setFile(selectedFile);
      setError("");

      // Auto-fill name from filename if empty
      if (!name) {
        const fileName = selectedFile.name.replace(/\.pdf$/i, "");
        setName(fileName);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    if (!name.trim()) {
      setError("Please provide a name for the checklist");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("subject", subject);
      formData.append("saveToDatabase", "false"); // Don't save yet, just generate

      const response = await fetch("/api/admin/parse-pdf-checklist", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to parse PDF");
      }

      // Show preview
      setPreviewCurriculum(data.curriculum);
      setShowPreview(true);
      setIsOpen(false); // Close upload dialog
    } catch (err: any) {
      console.error("Generate error:", err);
      setError(err.message || "Failed to generate checklist");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!previewCurriculum) return;

    setIsApproving(true);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("subject", subject);
      formData.append("saveToDatabase", "true"); // Now save it

      const response = await fetch("/api/admin/parse-pdf-checklist", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to save curriculum");
      }

      // Success!
      setShowPreview(false);
      router.refresh();

      // Reset form
      resetForm();
    } catch (err: any) {
      console.error("Approve error:", err);
      setError(err.message || "Failed to save curriculum");
      setShowPreview(false);
      setIsOpen(true); // Reopen upload dialog to show error
    } finally {
      setIsApproving(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setName("");
    setDescription("");
    setSubject("");
    setError("");
    setPreviewCurriculum(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    resetForm();
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setIsOpen(true); // Reopen upload dialog
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Import PDF Checklist
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleGenerate}>
            <DialogHeader>
              <DialogTitle>Import PDF as Interactive Checklist</DialogTitle>
              <DialogDescription>
                Upload a PDF document and AI will convert it into an engaging, Khan Academy-style interactive course with checklists, achievements, and progress tracking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF File *</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isGenerating}
                    required
                    className="flex-1"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="checklist-name">Course Name *</Label>
                <Input
                  id="checklist-name"
                  placeholder="e.g., Science Fair Project Adventure"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="checklist-description">Description (optional)</Label>
                <Textarea
                  id="checklist-description"
                  placeholder="A fun journey through the scientific method..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isGenerating}
                  rows={3}
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="checklist-subject">Subject (optional)</Label>
                <Input
                  id="checklist-subject"
                  placeholder="e.g., Science, Math, General"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Generate Preview
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <CurriculumPreview
        curriculum={previewCurriculum}
        isOpen={showPreview}
        onClose={handlePreviewClose}
        onApprove={handleApprove}
        isApproving={isApproving}
      />
    </>
  );
}
