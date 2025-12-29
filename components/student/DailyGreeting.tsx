"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar } from "lucide-react";

interface DailyGreetingProps {
  studentName: string;
  studentId: string;
}

export function DailyGreeting({ studentName, studentId }: DailyGreetingProps) {
  const [quote, setQuote] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getTimeOfDay = () => {
    const hour = today.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    try {
      const response = await fetch("/api/student/daily-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (response.ok && data.quote) {
        setQuote(data.quote);
      } else {
        setQuote("Keep learning, keep growing! You're doing great.");
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
      setQuote("Every day is a new opportunity to learn something amazing!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              {getTimeOfDay()}, {studentName}! 👋
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              <span>{dateString}</span>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Loading your daily inspiration...</span>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-base italic text-gray-700 dark:text-gray-300 leading-relaxed">
                  "{quote}"
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
