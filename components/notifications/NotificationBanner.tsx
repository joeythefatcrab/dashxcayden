"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

export function NotificationBanner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
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

  if (isLoading || messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
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
