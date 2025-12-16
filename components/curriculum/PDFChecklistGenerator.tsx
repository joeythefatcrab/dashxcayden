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

export function PDFChecklistGenerator() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");

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
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("subject", subject);
      formData.append("saveToDatabase", "true");

      const response = await fetch("/api/admin/parse-pdf-checklist", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to parse PDF");
      }

      setSuccess(true);

      // Wait a moment then close and refresh
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();

        // Reset form
        setFile(null);
        setName("");
        setDescription("");
        setSubject("");
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1500);
    } catch (err: any) {
      console.error("Generate error:", err);
      setError(err.message || "Failed to generate checklist");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setFile(null);
    setName("");
    setDescription("");
    setSubject("");
    setError("");
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
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
            <DialogTitle>Import PDF as Checklist</DialogTitle>
            <DialogDescription>
              Upload a PDF document (course pack, step list, etc.) and AI will convert it into a structured checklist curriculum.
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
                {file && (
                  <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="checklist-name">Checklist Name *</Label>
              <Input
                id="checklist-name"
                placeholder="e.g., Science Fair Project Steps"
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
                placeholder="Brief description of this checklist..."
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

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle className="h-4 w-4" />
                Checklist created successfully!
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
            <Button type="submit" disabled={isGenerating || success}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing PDF...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Created!
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Generate Checklist
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
