"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UploadDropzone } from "@/lib/uploadthing";
import { Upload, FileText, CheckCircle } from "lucide-react";

export function CurriculumUploader() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");

  const handleUploadComplete = (res: any) => {
    if (res && res[0]) {
      setUploadedFile({
        url: res[0].url,
        name: res[0].name,
      });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile) {
      setError("Please upload a file first");
      return;
    }

    if (!name) {
      setError("Please enter a curriculum name");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const response = await fetch("/api/curricula/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name,
          name,
          description,
          subject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import curriculum");
      }

      // Reset form
      setName("");
      setDescription("");
      setSubject("");
      setUploadedFile(null);
      setIsOpen(false);

      // Refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import curriculum");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Curriculum
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleImport}>
          <DialogHeader>
            <DialogTitle>Upload Curriculum</DialogTitle>
            <DialogDescription>
              Upload a CSV file to create a new curriculum. PDF and DOCX support
              coming soon.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload File</Label>
              {!uploadedFile ? (
                <UploadDropzone
                  endpoint="curriculumUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    setError(error.message);
                  }}
                  className="ut-button:bg-primary ut-button:ut-readying:bg-primary/50"
                />
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-green-500 bg-green-50 p-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      File uploaded successfully
                    </p>
                    <p className="text-xs text-green-700">{uploadedFile.name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* Curriculum Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Curriculum Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., U.S. History: Civil War"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the curriculum"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., History, Math, Science"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Info Box */}
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900">Supported Formats</p>
                  <ul className="mt-1 list-disc pl-5 text-blue-700">
                    <li>CSV files (fully supported)</li>
                    <li>PDF files (coming soon)</li>
                    <li>DOCX files (coming soon)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setUploadedFile(null);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isImporting || !uploadedFile}>
              {isImporting ? "Importing..." : "Import Curriculum"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
