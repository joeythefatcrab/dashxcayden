"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function SendMessageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recipientType, setRecipientType] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          recipientType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Reset form
      setTitle("");
      setContent("");
      setRecipientType("ALL");

      // Refresh to show new message in list
      router.refresh();

      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
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
            <Select
              value={recipientType}
              onValueChange={setRecipientType}
              disabled={isLoading}
            >
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

          <Button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="w-full"
          >
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
