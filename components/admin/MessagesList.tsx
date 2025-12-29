"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, User, Shield, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  title: string | null;
  content: string;
  recipientType: string;
  createdAt: string;
  sender: {
    name: string | null;
    email: string;
  };
  readReceipts: Array<{ userId: string; readAt: string }>;
};

export function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/admin/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case "ALL":
        return <Globe className="h-4 w-4" />;
      case "STUDENT":
        return <User className="h-4 w-4" />;
      case "PARENT":
        return <Users className="h-4 w-4" />;
      case "ADMIN":
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRecipientLabel = (type: string) => {
    switch (type) {
      case "ALL":
        return "All Users";
      case "STUDENT":
        return "Students";
      case "PARENT":
        return "Parents";
      case "ADMIN":
        return "Admins";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No messages sent yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {message.title && (
                    <h3 className="font-semibold text-lg mb-1">{message.title}</h3>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getRecipientIcon(message.recipientType)}
                  {getRecipientLabel(message.recipientType)}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                <span>
                  Sent by {message.sender.name || message.sender.email}
                </span>
                <span>
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {message.readReceipts.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {message.readReceipts.length} read
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
