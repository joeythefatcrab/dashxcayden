"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, RotateCcw } from "lucide-react";

export function RoleSwitcher() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSwitch = async (role: string) => {
    if (!role) return;

    setSelectedRole(role);
    setIsLoading(true);
    setError("");

    try {
      // Call API to set impersonation cookie
      const response = await fetch("/api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Failed to impersonate role");
      }

      // Redirect to the role's main page
      switch (role) {
        case "ADMIN":
          router.push("/parents");
          break;
        case "PARENT":
          router.push("/curricula");
          break;
        case "STUDENT":
          router.push("/my-courses");
          break;
        case "TEACHER":
          router.push("/curricula");
          break;
        default:
          router.refresh();
          break;
      }
    } catch (err) {
      setError("Failed to switch role");
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError("");
    setSelectedRole("");

    try {
      // Call API to clear impersonation cookie
      const response = await fetch("/api/superadmin/impersonate", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset role");
      }

      // Refresh to clear the impersonation
      router.push("/superadmin/overview");
      router.refresh();
    } catch (err) {
      setError("Failed to reset role");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4" />
          View As Role (QA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => handleRoleSwitch(e.target.value)}
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">Select role to view...</option>
            <option value="ADMIN">Admin</option>
            <option value="PARENT">Parent</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
          </select>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            title="Reset to SUPERADMIN"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Switch to view the platform as a different role for QA testing. Click the reset button to return to SUPERADMIN.
        </p>
      </CardContent>
    </Card>
  );
}
