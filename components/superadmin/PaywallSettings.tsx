"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldOff, ShieldCheck } from "lucide-react";

interface Student {
  id: string;
  name: string;
  paywallExempt: boolean;
  subscriptionActive: boolean;
  parent: { name: string | null; email: string };
}

interface PaywallSettingsProps {
  paywallEnabled: boolean;
  students: Student[];
}

export function PaywallSettings({ paywallEnabled, students }: PaywallSettingsProps) {
  const router = useRouter();
  const [globalEnabled, setGlobalEnabled] = useState(paywallEnabled);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [studentStates, setStudentStates] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map((s) => [s.id, s.paywallExempt]))
  );
  const [loadingStudents, setLoadingStudents] = useState<Set<string>>(new Set());

  const toggleGlobal = async () => {
    setGlobalLoading(true);
    try {
      const res = await fetch("/api/superadmin/paywall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !globalEnabled }),
      });
      if (res.ok) {
        setGlobalEnabled((prev) => !prev);
        router.refresh();
      }
    } finally {
      setGlobalLoading(false);
    }
  };

  const toggleStudentExempt = async (studentId: string) => {
    setLoadingStudents((prev) => new Set(prev).add(studentId));
    try {
      const newValue = !studentStates[studentId];
      const res = await fetch(
        `/api/superadmin/students/${studentId}/paywall-exempt`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exempt: newValue }),
        }
      );
      if (res.ok) {
        setStudentStates((prev) => ({ ...prev, [studentId]: newValue }));
      }
    } finally {
      setLoadingStudents((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Global toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {globalEnabled ? (
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ShieldOff className="h-5 w-5 text-yellow-500" />
            )}
            <CardTitle>Subscription Paywall</CardTitle>
          </div>
          <CardDescription>
            When enabled, students without an active subscription see a popup blocking lesson access.
            Disable this globally for demos, pilots, or testing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">
                Paywall is currently{" "}
                <span className={globalEnabled ? "text-green-700" : "text-yellow-600"}>
                  {globalEnabled ? "ON" : "OFF (all students can access freely)"}
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {globalEnabled
                  ? "Students need an active subscription to access lessons."
                  : "Paywall is disabled. All students can access all lessons."}
              </p>
            </div>
            <button
              onClick={toggleGlobal}
              disabled={globalLoading}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                globalEnabled ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              {globalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
              ) : (
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    globalEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Per-student exemptions */}
      <Card>
        <CardHeader>
          <CardTitle>Pilot & Tester Exemptions</CardTitle>
          <CardDescription>
            These students bypass the paywall even when it&apos;s globally enabled — perfect for
            pilots, testers, and demo accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students found.</p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const isExempt = studentStates[student.id];
                const isLoading = loadingStudents.has(student.id);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{student.name}</span>
                        {student.subscriptionActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Subscribed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                            No Sub
                          </Badge>
                        )}
                        {isExempt && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            Exempt
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Parent: {student.parent.name || student.parent.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {isExempt ? "Exempt" : "Not exempt"}
                      </span>
                      <button
                        onClick={() => toggleStudentExempt(student.id)}
                        disabled={isLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          isExempt ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mx-auto text-white" />
                        ) : (
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              isExempt ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        )}
                      </button>
                    </div>
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
