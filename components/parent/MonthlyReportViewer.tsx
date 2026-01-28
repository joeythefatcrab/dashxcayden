"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Plus, Trash2, Sparkles, Download, Pencil } from "lucide-react";
import { ExternalActivityForm } from "./ExternalActivityForm";
import { AttendanceTracker } from "./AttendanceTracker";
import { ParentNotesEditor } from "./ParentNotesEditor";
import { EducatorEvaluationForm } from "./EducatorEvaluationForm";
import { format } from "date-fns";

type Student = {
  id: string;
  name: string;
  grade: number | null;
};

type Props = {
  students: Student[];
};

export function MonthlyReportViewer({ students }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<string>(
    students[0]?.id || ""
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (selectedStudent && selectedMonth && selectedYear) {
      loadReportData();
    }
  }, [selectedStudent, selectedMonth, selectedYear]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/parent/monthly-report?studentId=${selectedStudent}&month=${selectedMonth}&year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Error loading report:", error);
      alert("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/parent/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to generate report");
      }

      const data = await response.json();
      setReportData((prev: any) => ({
        ...prev,
        report: data.report,
      }));

      alert("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate report. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/parent/external-activity?id=${activityId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete activity");
      }

      await loadReportData();
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                      {student.grade && ` (Grade ${student.grade})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : reportData ? (
        <>
          {/* Course Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Course Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {!reportData.courseStats || reportData.courseStats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No course activity recorded for this period.
                </p>
              ) : (
                <div className="space-y-4">
                  {reportData.courseStats.map((course: any) => (
                    <div
                      key={course.curriculumId}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{course.name}</h4>
                        {course.subject && (
                          <p className="text-sm text-muted-foreground">
                            {course.subject}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <span>
                            <strong>{course.lessonsCompleted}</strong> lessons
                          </span>
                          <span>
                            <strong>{course.timeSpentHours}</strong> hours
                          </span>
                          {course.averageScore > 0 && (
                            <span>
                              Avg score: <strong>{course.averageScore}%</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 rounded-lg bg-muted/50 p-4">
                    <h4 className="font-semibold mb-2">Time Summary</h4>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div>
                        Online coursework:{" "}
                        <strong>{reportData.summary.totalAppHours} hours</strong>
                      </div>
                      <div>
                        External activities:{" "}
                        <strong>
                          {reportData.summary.totalExternalHours} hours
                        </strong>
                      </div>
                      <div className="md:col-span-1">
                        <strong className="text-lg">
                          Total: {reportData.summary.totalSchoolHours} hours
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Tracking */}
          <AttendanceTracker
            reportId={reportData.report.id}
            initialAttendance={reportData.report.attendanceData as any}
            onSave={loadReportData}
          />

          {/* Parent Notes */}
          <ParentNotesEditor
            reportId={reportData.report.id}
            initialNotes={reportData.report.parentNotes || ""}
            onSave={loadReportData}
          />

          {/* Educator Evaluation */}
          {reportData?.report?.id && (
            <EducatorEvaluationForm
              reportId={reportData.report.id}
              initialAnswers={reportData.report.educatorEvaluation || null}
              onSave={loadReportData}
            />
          )}

          {/* External Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>External Activities</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowActivityForm(!showActivityForm);
                    setEditingActivity(null); // Clear any editing state
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(showActivityForm || editingActivity) && (
                <div className="mb-4">
                  <ExternalActivityForm
                    reportId={reportData.report.id}
                    activity={editingActivity}
                    onSuccess={() => {
                      setShowActivityForm(false);
                      setEditingActivity(null);
                      loadReportData();
                    }}
                    onCancel={() => {
                      setShowActivityForm(false);
                      setEditingActivity(null);
                    }}
                  />
                </div>
              )}

              {!reportData.report.externalActivities || reportData.report.externalActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No external activities recorded. Add field trips, reading time,
                  projects, or other educational activities done outside the app.
                </p>
              ) : (
                <div className="space-y-3">
                  {(reportData.report.externalActivities || []).map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{activity.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {/* Display date directly from string to avoid timezone shift */}
                              {(() => {
                                const [year, month, day] = activity.date.substring(0, 10).split('-');
                                const monthNames = ["January", "February", "March", "April", "May", "June",
                                  "July", "August", "September", "October", "November", "December"];
                                return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
                              })()}
                              {activity.category && ` • ${activity.category}`}
                              {activity.hoursSpent && ` • ${activity.hoursSpent} hours`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingActivity(activity);
                                setShowActivityForm(false);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteActivity(activity.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {activity.description && (
                          <p className="mt-2 text-sm">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>AI-Generated Report</CardTitle>
                <div className="flex gap-2">
                  {reportData.report.reportContent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Print/Save
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={generateReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {reportData.report.reportContent ? "Regenerate" : "Generate"} Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportData.report.reportContent ? (
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg bg-muted/30 p-6">
                  {reportData.report.reportContent}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Click "Generate Report" to create an AI-powered summary of this
                    month's progress.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The report will include course activity, time spent, and external
                    activities in a professional format.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
