"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Plus, Calendar, ChevronDown, ChevronUp, BookOpen, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type Curriculum = {
  id: string;
  name: string;
  subject: string | null;
};

type TimeLog = {
  id: string;
  date: Date;
  minutesSpent: number;
  curriculum: {
    name: string;
    subject: string | null;
  };
};

type Props = {
  student: {
    id: string;
    name: string;
  };
  curricula: Curriculum[];
  initialTimeLogs: TimeLog[];
};

// Mirror exact APS subject names so they map 1:1 to the monthly report
const ACTIVITY_CATEGORIES = [
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

export function TimeTrackingInterface({ student, curricula, initialTimeLogs }: Props) {
  const router = useRouter();
  const [timeLogs, setTimeLogs] = useState(initialTimeLogs);
  const [loading, setLoading] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Course Time form state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");

  // External Activity form state
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityHours, setActivityHours] = useState("");
  const [activityMinutes, setActivityMinutes] = useState("");
  const [activityCategory, setActivityCategory] = useState("");

  const handleCourseTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

      if (totalMinutes <= 0) {
        alert("Please enter a valid time amount");
        setLoading(false);
        return;
      }

      if (!selectedCurriculum) {
        alert("Please select a course");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/student/time-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          curriculumId: selectedCurriculum,
          minutesSpent: totalMinutes,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save time log");
      }

      // Reset form
      setHours("");
      setMinutes("");
      setSelectedCurriculum("");
      setDescription("");
      setDialogOpen(false);

      // Refresh page to show new entry
      router.refresh();
    } catch (error) {
      console.error("Error saving time log:", error);
      alert(error instanceof Error ? error.message : "Failed to save time log");
    } finally {
      setLoading(false);
    }
  };

  const handleExternalActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!activityTitle || !activityDate) {
        alert("Title and date are required");
        setLoading(false);
        return;
      }

      // Calculate total hours from hours and minutes
      const totalHours = (parseInt(activityHours) || 0) + (parseInt(activityMinutes) || 0) / 60;

      const response = await fetch("/api/student/external-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activityTitle,
          description: activityDescription || null,
          date: activityDate,
          hoursSpent: totalHours > 0 ? totalHours : null,
          category: activityCategory || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add activity");
      }

      // Reset form
      setActivityTitle("");
      setActivityDescription("");
      setActivityHours("");
      setActivityMinutes("");
      setActivityCategory("");
      setDialogOpen(false);

      // Refresh page
      router.refresh();
    } catch (error) {
      console.error("Error adding activity:", error);
      alert(error instanceof Error ? error.message : "Failed to add activity");
    } finally {
      setLoading(false);
    }
  };

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Group logs by date
  const logsByDate = timeLogs.reduce((acc, log) => {
    const dateKey = new Date(log.date).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, TimeLog[]>);

  const totalMinutesThisMonth = timeLogs.reduce((sum, log) => sum + log.minutesSpent, 0);
  const totalEntries = timeLogs.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(totalMinutesThisMonth)}</p>
                <p className="text-sm text-muted-foreground">Total Time This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEntries}</p>
                <p className="text-sm text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log New Time - Dialog Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full">
            <Plus className="h-5 w-5 mr-2" />
            Log Time or Activity
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Your Time</DialogTitle>
            <DialogDescription>
              Record course time or add an external activity
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="course" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="course">
                <BookOpen className="h-4 w-4 mr-2" />
                Course Time
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Sparkles className="h-4 w-4 mr-2" />
                External Activity
              </TabsTrigger>
            </TabsList>

            {/* Course Time Tab */}
            <TabsContent value="course">
              <form onSubmit={handleCourseTimeSubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="curriculum">Course *</Label>
                    <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {curricula.map((curriculum) => (
                          <SelectItem key={curriculum.id} value={curriculum.id}>
                            {curriculum.subject || curriculum.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours</Label>
                    <Input
                      id="hours"
                      type="number"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minutes">Minutes</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">What did you work on?</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you studied or worked on..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Log Time"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* External Activity Tab */}
            <TabsContent value="activity">
              <form onSubmit={handleExternalActivitySubmit} className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-title">Activity Title *</Label>
                    <Input
                      id="activity-title"
                      placeholder="e.g., Visit to Science Museum"
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-date">Date *</Label>
                    <Input
                      id="activity-date"
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={activityCategory} onValueChange={setActivityCategory}>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="activity-hours">Hours</Label>
                    <Input
                      id="activity-hours"
                      type="number"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={activityHours}
                      onChange={(e) => setActivityHours(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-minutes">Minutes</Label>
                    <Input
                      id="activity-minutes"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={activityMinutes}
                      onChange={(e) => setActivityMinutes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity-description">Description</Label>
                  <Textarea
                    id="activity-description"
                    placeholder="Describe what you did and what you learned..."
                    rows={3}
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Activity"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Time Log History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Time Log</CardTitle>
          <CardDescription>
            Recent entries from this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No time logged yet. Start tracking your study time above!
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(logsByDate).map(([date, logs]) => {
                const totalMinutesForDay = logs.reduce((sum, log) => sum + log.minutesSpent, 0);
                const isCollapsed = collapsedDates.has(date);

                return (
                  <div key={date} className="space-y-2">
                    <button
                      onClick={() => toggleDateCollapse(date)}
                      className="flex items-center justify-between w-full rounded-lg border p-3 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{date}</span>
                        <Badge variant="outline" className="font-normal">
                          {formatTime(totalMinutesForDay)}
                        </Badge>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-2 ml-6">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center gap-3 rounded-lg border p-3"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium">
                                {log.curriculum.subject || log.curriculum.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(log.minutesSpent)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
