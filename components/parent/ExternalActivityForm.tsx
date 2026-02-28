"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  hoursSpent: number | null;
  category: string | null;
};

type Props = {
  reportId: string;
  onSuccess: () => void;
  onCancel: () => void;
  activity?: Activity; // Optional: for editing existing activity
};

export function ExternalActivityForm({ reportId, onSuccess, onCancel, activity }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [hoursSpent, setHoursSpent] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
      // Extract date in UTC (YYYY-MM-DD format) to avoid timezone conversion
      const dateStr = activity.date.substring(0, 10); // Get YYYY-MM-DD part
      setDate(dateStr);
      setHoursSpent(activity.hoursSpent?.toString() || "");
      setCategory(activity.category || "");
    }
  }, [activity]);

  // Mirror exact APS subject names so they map 1:1 to the monthly report
  const categories = [
    "Study Skills/Study Technology",
    "Reading",
    "Vocabulary",
    "Handwriting",
    "Creative Writing",
    "Grammar",
    "Spelling",
    "Mathematics",
    "Geography",
    "American/World History",
    "Economics/Money",
    "Government/Civics",
    "Science",
    "Research",
    "Performing Arts",
    "Foreign Language",
    "PE",
    "Educational Films",
    "Seminars",
    "Field Trips",
    "Electives",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = activity
        ? `/api/parent/external-activity?id=${activity.id}`
        : "/api/parent/external-activity";

      const method = activity ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          title,
          description,
          date,
          hoursSpent: hoursSpent ? parseFloat(hoursSpent) : null,
          category: category || null,
        }),
      });

      if (!response.ok) {
        throw new Error(activity ? "Failed to update activity" : "Failed to add activity");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving activity:", error);
      alert(activity ? "Failed to update activity. Please try again." : "Failed to add activity. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Museum Visit, Book Report"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursSpent">Hours Spent</Label>
              <Input
                id="hoursSpent"
                type="number"
                step="0.5"
                min="0"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                placeholder="e.g., 2.5"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the activity and what was learned..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !date}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {activity ? "Updating..." : "Adding..."}
                </>
              ) : (
                activity ? "Update Activity" : "Add Activity"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
