"use client";

import { useState, useEffect } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash2, FileText, FileImage, Loader2 } from "lucide-react";

type Attachment = {
  id: string;
  url: string;
  name: string;
  size: number | null;
  mimeType: string | null;
};

export function ReportAttachmentUploader({ reportId }: { reportId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/parent/report-attachments?reportId=${reportId}`);
    if (res.ok) setAttachments(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [reportId]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/parent/report-attachments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId: id }),
    });
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  };

  const fileIcon = (mimeType: string | null) => {
    if (mimeType?.startsWith("image/")) return <FileImage className="h-4 w-4 text-blue-500" />;
    return <FileText className="h-4 w-4 text-orange-500" />;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </CardTitle>
          <UploadButton<OurFileRouter, "reportAttachment">
            endpoint="reportAttachment"
            onClientUploadComplete={async (res) => {
              for (const file of res) {
                await fetch("/api/parent/report-attachments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    reportId,
                    url: file.url,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type,
                  }),
                });
              }
              load();
            }}
            onUploadError={(err) => alert(`Upload failed: ${err.message}`)}
            appearance={{
              button: "ut-ready:bg-primary ut-ready:text-primary-foreground ut-uploading:bg-primary/70 text-sm px-3 py-1.5 rounded-md h-auto",
              allowedContent: "hidden",
            }}
            content={{ button: "Upload Files" }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Attach essays, term papers, photos, or any documents for this report (PDF, Word, JPEG).
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attachments yet.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  {fileIcon(a.mimeType)}
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium truncate hover:underline"
                  >
                    {a.name}
                  </a>
                  {a.size && (
                    <span className="text-xs text-muted-foreground shrink-0">{formatSize(a.size)}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(a.id)}
                  disabled={deleting === a.id}
                >
                  {deleting === a.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
