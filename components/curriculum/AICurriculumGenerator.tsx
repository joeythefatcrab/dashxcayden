"use client";

import { useState } from "react";
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
import { UploadDropzone } from "@/lib/uploadthing";
import { Sparkles, Wand2, Loader2, FileImage, FileText } from "lucide-react";

export function AICurriculumGenerator() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [outline, setOutline] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) {
      setError("Please enter a curriculum title");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/ai/generate-curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subject,
          gradeLevel: gradeLevel ? parseInt(gradeLevel) : undefined,
          outline,
          imageUrl: uploadedImage,
          saveToDatabase: true, // Automatically save to database
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Failed to generate curriculum";
        throw new Error(errorMsg);
      }

      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      setGradeLevel("");
      setOutline("");
      setUploadedImage(null);
      setIsOpen(false);

      // Refresh the page to show new curriculum
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate curriculum");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadComplete = (res: any) => {
    if (res && res[0]) {
      setUploadedImage(res[0].url);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-500 bg-purple-50 hover:bg-purple-100">
          <Wand2 className="mr-2 h-4 w-4 text-purple-600" />
          <span className="text-purple-700">AI Generate Curriculum</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleGenerate}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI-Powered Curriculum Generator
            </DialogTitle>
            <DialogDescription>
              Describe your curriculum or upload a wireframe, and AI will generate a complete
              curriculum with lessons and assessments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Curriculum Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Introduction to Physics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Science, Math, History"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="e.g., 8"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Brief Description</Label>
                  <Input
                    id="description"
                    placeholder="What is this curriculum about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Curriculum Outline */}
            <div className="space-y-2">
              <Label htmlFor="outline">Curriculum Outline / Requirements</Label>
              <Textarea
                id="outline"
                placeholder="Describe what topics should be covered, learning objectives, or paste an outline here...

Example:
- Unit 1: Newton's Laws of Motion
  - Lesson 1: First Law (Inertia)
  - Lesson 2: Second Law (F=ma)
- Unit 2: Energy and Work
  - Lesson 1: Types of Energy
  - Lesson 2: Conservation of Energy"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Optional: Upload Wireframe Image */}
            <div className="space-y-2">
              <Label>Upload Wireframe Image (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Upload a diagram, wireframe, or screenshot of your curriculum structure
              </p>
              {!uploadedImage ? (
                <UploadDropzone
                  endpoint="curriculumUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    setError(error.message);
                  }}
                  className="ut-button:bg-purple-600 ut-button:ut-readying:bg-purple-500 ut-allowed-content:text-xs"
                />
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-purple-500 bg-purple-50 p-4">
                  <FileImage className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">
                      Wireframe image uploaded
                    </p>
                    <p className="text-xs text-purple-700">
                      AI will analyze this image to generate the curriculum
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedImage(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* AI Features Info */}
            <div className="rounded-md bg-gradient-to-r from-purple-50 to-pink-50 p-4">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-purple-900">AI will generate:</p>
                  <ul className="mt-2 space-y-1 text-purple-700">
                    <li className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      2-3 units with detailed lesson content
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Rich markdown content for each lesson
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Assessment questions (MCQ, short answer, etc.)
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Learning objectives and grading thresholds
                    </li>
                  </ul>
                </div>
              </div>
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
              onClick={() => {
                setIsOpen(false);
                setError("");
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Curriculum
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
