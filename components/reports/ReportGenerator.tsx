"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet } from "lucide-react";

interface Student {
  id: string;
  name: string;
  grade: number | null;
}

interface Curriculum {
  id: string;
  name: string;
  subject: string | null;
}

interface ReportGeneratorProps {
  students: Student[];
  curricula: Curriculum[];
}

export function ReportGenerator({ students, curricula }: ReportGeneratorProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    students.map((s) => s.id)
  );
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleCurriculum = (curriculumId: string) => {
    setSelectedCurricula((prev) =>
      prev.includes(curriculumId)
        ? prev.filter((id) => id !== curriculumId)
        : [...prev, curriculumId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(students.map((s) => s.id));
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  const selectAllCurricula = () => {
    setSelectedCurricula(curricula.map((c) => c.id));
  };

  const deselectAllCurricula = () => {
    setSelectedCurricula([]);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (selectedStudents.length > 0) {
        params.append("studentIds", selectedStudents.join(","));
      }

      if (selectedCurricula.length > 0) {
        params.append("curriculumIds", selectedCurricula.join(","));
      }

      if (startDate) {
        params.append("startDate", new Date(startDate).toISOString());
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        params.append("endDate", endDateTime.toISOString());
      }

      params.append("format", "csv");

      // Fetch CSV
      const response = await fetch(`/api/reports/progress?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Download CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `progress-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Select Students</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllStudents}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={deselectAllStudents}
            >
              Deselect All
            </Button>
          </div>
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No students found. Add students to generate reports.
          </p>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`student-${student.id}`}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={() => toggleStudent(student.id)}
                />
                <Label
                  htmlFor={`student-${student.id}`}
                  className="cursor-pointer font-normal"
                >
                  {student.name}
                  {student.grade && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (Grade {student.grade})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curriculum Selection */}
      {curricula.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Filter by Curriculum (Optional)
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAllCurricula}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAllCurricula}
              >
                Deselect All
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Leave empty to include all curricula
          </p>
          <div className="space-y-2">
            {curricula.map((curriculum) => (
              <div key={curriculum.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`curriculum-${curriculum.id}`}
                  checked={selectedCurricula.includes(curriculum.id)}
                  onCheckedChange={() => toggleCurriculum(curriculum.id)}
                />
                <Label
                  htmlFor={`curriculum-${curriculum.id}`}
                  className="cursor-pointer font-normal"
                >
                  {curriculum.name}
                  {curriculum.subject && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({curriculum.subject})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Date Range (Optional)
        </Label>
        <p className="text-sm text-muted-foreground">
          Leave empty to include all dates
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerateReport}
        disabled={isGenerating || selectedStudents.length === 0 || students.length === 0}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>Generating Report...</>
        ) : (
          <>
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Download CSV Report
          </>
        )}
      </Button>

      {selectedStudents.length === 0 && students.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Please select at least one student
        </p>
      )}
    </div>
  );
}
