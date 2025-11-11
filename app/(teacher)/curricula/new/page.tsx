"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@/lib/uploadthing";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewCurriculumPage() {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [curriculumName, setCurriculumName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImport = async () => {
    if (!fileUrl || !curriculumName) return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/curricula/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          fileName,
          name: curriculumName,
          description,
          subject,
        }),
      });

      if (!response.ok) {
        throw new Error("Import failed");
      }

      const result = await response.json();
      router.push(`/curricula/${result.curriculumId}`);
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import curriculum. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/curricula">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Curricula
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload Curriculum</h1>
          <p className="text-muted-foreground">
            Upload a PDF, DOCX, or CSV file to import your curriculum
          </p>
        </div>

        <div className="space-y-6">
          {!fileUrl ? (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload File</CardTitle>
                <CardDescription>
                  Supported formats: PDF, DOCX, CSV (max 16MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadDropzone
                  endpoint="curriculumUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setFileUrl(res[0].url);
                      setFileName(res[0].name);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`Upload error: ${error.message}`);
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Uploaded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{fileName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setFileUrl(null);
                      setFileName("");
                    }}
                  >
                    Upload Different File
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Curriculum Details</CardTitle>
                  <CardDescription>
                    Provide information about this curriculum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Curriculum Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., U.S. History: Civil War Unit"
                      value={curriculumName}
                      onChange={(e) => setCurriculumName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief description of this curriculum"
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
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Link href="/curricula">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  onClick={handleImport}
                  disabled={!curriculumName || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import Curriculum"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
