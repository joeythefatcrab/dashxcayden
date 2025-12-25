"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  MessageSquare,
  Send,
  RotateCcw,
} from "lucide-react";

interface AIProgressInsightsProps {
  studentId: string;
  studentName: string;
  stats: {
    totalEnrollments: number;
    totalAttempts: number;
    avgScore: number;
    recentAvg: number;
    curriculaProgress: any[];
  };
}

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIProgressInsights({
  studentId,
  studentName,
  stats,
}: AIProgressInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  const generateInitialReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/parent/progress-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          stats,
          messages: [],
          type: "initial",
          threadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate insights");
      }

      if (data.threadId) {
        setThreadId(data.threadId);
      }

      setMessages([
        {
          role: "assistant",
          content: data.message,
        },
      ]);
      setHasGeneratedInitial(true);
    } catch (error) {
      console.error("Error generating initial report:", error);
      setMessages([
        {
          role: "assistant",
          content: "Sorry, I encountered an error generating the progress report. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/parent/progress-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          stats,
          messages: newMessages,
          type: "chat",
          threadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      if (data.threadId) {
        setThreadId(data.threadId);
      }

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setHasGeneratedInitial(false);
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Progress Insights</CardTitle>
          </div>
          {hasGeneratedInitial && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
        <CardDescription>
          Get AI-powered analysis and ask questions about {studentName}'s progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasGeneratedInitial && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-6 rounded-full bg-purple-100 dark:bg-purple-900/20 p-6">
              <Sparkles className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to Analyze Progress</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Generate an AI-powered progress report to get insights, identify strengths
              and areas for improvement, and ask follow-up questions.
            </p>
            <Button
              onClick={generateInitialReport}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Progress Report
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Messages */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-purple-50 dark:bg-purple-900/20 text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about progress, performance, or recommendations..."
                  className="min-h-[60px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-[60px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
