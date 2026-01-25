"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { BookOpen, User, Plus, Trash2, Shield, RefreshCw } from "lucide-react";

type Parent = {
  id: string;
  name: string | null;
  email: string;
};

type Curriculum = {
  id: string;
  name: string;
  subject: string | null;
  grade: number | null;
  description: string | null;
  isPublic: boolean;
};

type AccessRecord = {
  id: string;
  parentId: string;
  curriculumId: string;
  grantedAt: Date;
  parent: {
    id: string;
    name: string | null;
    email: string;
  };
  curriculum: {
    id: string;
    name: string;
    subject: string | null;
  };
};

interface Props {
  parents: Parent[];
  curricula: Curriculum[];
  initialAccessRecords: AccessRecord[];
}

export function CurriculumAccessManager({ parents, curricula, initialAccessRecords }: Props) {
  const router = useRouter();
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);

  const handleGrantAccess = async () => {
    if (!selectedParent || (!selectedCurriculum && !bulkMode)) {
      setError("Please select both parent and curriculum");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const curriculaToGrant = bulkMode ? selectedCurricula : [selectedCurriculum];

      // Grant access for each selected curriculum
      for (const currId of curriculaToGrant) {
        const response = await fetch("/api/admin/parent-curriculum-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: selectedParent,
            curriculumId: currId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to grant access");
        }
      }

      setSuccess(`Access granted successfully!`);
      setSelectedCurriculum("");
      setSelectedCurricula([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grant access");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (parentId: string, curriculumId: string) => {
    if (!confirm("Are you sure you want to revoke this access?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/parent-curriculum-access?parentId=${parentId}&curriculumId=${curriculumId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to revoke access");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke access");
    } finally {
      setLoading(false);
    }
  };

  const toggleCurriculumSelection = (curriculumId: string) => {
    setSelectedCurricula((prev) =>
      prev.includes(curriculumId)
        ? prev.filter((id) => id !== curriculumId)
        : [...prev, curriculumId]
    );
  };

  // Filter access records by selected parent
  const filteredAccessRecords = selectedParent
    ? initialAccessRecords.filter((record) => record.parentId === selectedParent)
    : initialAccessRecords;

  // Get parent's current access
  const parentAccessCurriculumIds = new Set(
    filteredAccessRecords.map((record) => record.curriculumId)
  );

  return (
    <div className="space-y-6">
      {/* Grant Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Grant Curriculum Access
          </CardTitle>
          <CardDescription>
            Select a parent and curricula to grant access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 text-green-600 p-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parent-select">Parent</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger id="parent-select">
                  <SelectValue placeholder="Select a parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name || parent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-mode">Bulk Mode</Label>
                <Checkbox
                  id="bulk-mode"
                  checked={bulkMode}
                  onCheckedChange={(checked) => setBulkMode(checked as boolean)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {bulkMode ? "Select multiple curricula below" : "Select one curriculum"}
              </p>
            </div>
          </div>

          {!bulkMode && (
            <div className="space-y-2">
              <Label htmlFor="curriculum-select">Curriculum</Label>
              <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum}>
                <SelectTrigger id="curriculum-select">
                  <SelectValue placeholder="Select a curriculum" />
                </SelectTrigger>
                <SelectContent>
                  {curricula.map((curriculum) => (
                    <SelectItem key={curriculum.id} value={curriculum.id}>
                      {curriculum.name} {curriculum.subject && `- ${curriculum.subject}`}
                      {curriculum.isPublic && " (Public)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {bulkMode && selectedParent && (
            <div className="space-y-2">
              <Label>Select Curricula</Label>
              <div className="grid gap-2 max-h-[400px] overflow-y-auto border rounded-lg p-4">
                {curricula.map((curriculum) => {
                  const hasAccess = parentAccessCurriculumIds.has(curriculum.id);
                  return (
                    <div
                      key={curriculum.id}
                      className={`flex items-center space-x-2 p-2 rounded hover:bg-accent ${
                        hasAccess ? "opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        id={`curriculum-${curriculum.id}`}
                        checked={selectedCurricula.includes(curriculum.id)}
                        onCheckedChange={() => toggleCurriculumSelection(curriculum.id)}
                        disabled={hasAccess}
                      />
                      <label
                        htmlFor={`curriculum-${curriculum.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        <div className="font-medium">{curriculum.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {curriculum.subject && `${curriculum.subject} • `}
                          {curriculum.grade && `Grade ${curriculum.grade} • `}
                          {curriculum.isPublic && "Public • "}
                          {hasAccess && "Already has access"}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedCurricula.length} curricula selected
              </p>
            </div>
          )}

          <Button onClick={handleGrantAccess} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Granting Access..." : "Grant Access"}
          </Button>
        </CardContent>
      </Card>

      {/* Current Access Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Current Access Records
              </CardTitle>
              <CardDescription>
                {selectedParent
                  ? `Showing access for selected parent (${filteredAccessRecords.length} records)`
                  : `All access records (${initialAccessRecords.length} total)`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAccessRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No access records found. Grant access to parents above.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredAccessRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {record.parent.name || record.parent.email}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{record.curriculum.name}</span>
                      {record.curriculum.subject && (
                        <Badge variant="outline">{record.curriculum.subject}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground ml-8">
                      Granted {new Date(record.grantedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeAccess(record.parentId, record.curriculumId)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
