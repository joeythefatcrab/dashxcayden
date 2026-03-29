"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SendMessageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState("ALL");
  const [sendEmail, setSendEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; skipped: number; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, recipientType, sendEmail }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();

      setResult(data.emailResult ?? null);
      setTitle("");
      setContent("");
      setRecipientType("ALL");
      setSendEmail(false);
      router.refresh();
    } catch (error) {
      console.error("Error sending message:", error);
      setResult({ sent: 0, skipped: 0, error: "Failed to send. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Message title..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message here..."
              required
              rows={6}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientType">Send To *</Label>
            <Select value={recipientType} onValueChange={setRecipientType} disabled={isLoading}>
              <SelectTrigger id="recipientType">
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Users</SelectItem>
                <SelectItem value="STUDENT">All Students</SelectItem>
                <SelectItem value="PARENT">All Parents</SelectItem>
                <SelectItem value="ADMIN">All Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email blast toggle */}
          <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(v) => setSendEmail(v === true)}
              disabled={isLoading}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="sendEmail" className="cursor-pointer flex items-center gap-1.5 font-medium">
                <Mail className="h-4 w-4" />
                Also send as email blast
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sends a formatted email to every recipient's address via Resend. Requires{" "}
                <code className="text-xs bg-muted px-1 rounded">RESEND_API_KEY</code> to be set.
              </p>
            </div>
          </div>

          {/* Result banner */}
          {result && (
            <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              result.error ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
            }`}>
              {result.error ? (
                <>
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">In-app message sent.</span>
                    {" "}Email blast failed: {result.error}
                  </div>
                </>
              ) : result.sent > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Message sent + <strong>{result.sent} email{result.sent !== 1 ? "s" : ""}</strong> delivered.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Message sent successfully.</span>
                </>
              )}
            </div>
          )}

          <Button type="submit" disabled={!content.trim() || isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
