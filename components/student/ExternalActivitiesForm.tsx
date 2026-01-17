"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

type ExternalActivity = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  hoursSpent: number | null;
  category: string | null;
};

type Props = {
  studentId: string;
  initialActivities: ExternalActivity[];
};

const ACTIVITY_CATEGORIES = [
  "Field Trip",
  "Reading",
  "Project",
  "Volunteer Work",
  "Sports/Physical Activity",
  "Music/Arts",
  "Science Experiment",
  "Other",
];

export function ExternalActivitiesForm({ studentId, initialActivities }: Props) {
  const router = useRouter();
  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!title || !date) {
        alert("Title and date are required");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/student/external-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          date,
          hoursSpent: hours ? parseFloat(hours) : null,
          category: category || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add activity");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setHours("");
      setCategory("");

      // Refresh page
      router.refresh();
    } catch (error) {
      console.error("Error adding activity:", error);
      alert(error instanceof Error ? error.message : "Failed to add activity");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    setDeleteLoading(activityId);

    try {
      const response = await fetch(`/api/student/external-activity?id=${activityId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete activity");
      }

      // Refresh page
      router.refresh();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert(error instanceof Error ? error.message : "Failed to delete activity");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-sm text-muted-foreground">Total Activities This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Activity Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add External Activity
          </CardTitle>
          <CardDescription>
            Log field trips, reading, projects, and other educational activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Activity Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Visit to Science Museum"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-date">Date *</Label>
                <Input
                  id="activity-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity-hours">Hours Spent</Label>
                <Input
                  id="activity-hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="e.g., 2.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you did and what you learned..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Activity"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Activities</CardTitle>
          <CardDescription>
            Activities submitted this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activities logged yet. Add your first activity above!
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{activity.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                        {activity.category && <span>• {activity.category}</span>}
                        {activity.hoursSpent && <span>• {activity.hoursSpent} hours</span>}
                      </div>
                      {activity.description && (
                        <p className="text-sm mt-2">{activity.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(activity.id)}
                      disabled={deleteLoading === activity.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
