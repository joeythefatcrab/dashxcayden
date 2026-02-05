"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Bell, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Message = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    name: string | null;
    email: string;
  };
};

type RevisionRequest = {
  id: string;
  itemId: string;
  lessonId: string;
  revisionNote: string;
  revisionRequestedAt: string;
  lessonTitle?: string;
};

export function NotificationBanner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [revisionRequests, setRevisionRequests] = useState<RevisionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    fetchRevisionRequests();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      // Only show unread messages
      setMessages(data.filter((msg: Message) => !msg.isRead));
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRevisionRequests = async () => {
    try {
      const response = await fetch("/api/student/revision-requests");
      if (!response.ok) {
        return; // Silently fail for non-students
      }
      const data = await response.json();
      setRevisionRequests(data);
    } catch (error) {
      // Ignore errors (user might not be a student)
    }
  };

  const handleDismiss = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }

      // Remove from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error("Error dismissing message:", error);
    }
  };

  if (isLoading || (messages.length === 0 && revisionRequests.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Revision Requests */}
      {revisionRequests.map((request) => (
        <Card
          key={request.id}
          className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  Essay Revision Requested
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                  {request.lessonTitle ? `Lesson: ${request.lessonTitle}` : "One of your essays needs revision"}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 whitespace-pre-wrap mb-2">
                  {request.revisionNote}
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`/my-courses/${request.lessonId}`}>
                    <Button size="sm" variant="default" className="h-8">
                      Revise Essay
                    </Button>
                  </Link>
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    Requested {formatDistanceToNow(new Date(request.revisionRequestedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Admin Messages */}
      {messages.map((message) => (
        <Card
          key={message.id}
          className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                {message.title && (
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {message.title}
                  </h3>
                )}
                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <span>From: {message.sender.name || message.sender.email}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(message.id)}
                className="flex-shrink-0 h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
