"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

export function RoleSwitcher() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");

  const handleRoleSwitch = (role: string) => {
    setSelectedRole(role);

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
      default:
        break;
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
      <CardContent>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleSwitch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select role to view...</option>
          <option value="ADMIN">Admin</option>
          <option value="PARENT">Parent</option>
          <option value="STUDENT">Student</option>
        </select>
        <p className="text-xs text-muted-foreground mt-2">
          Switch to view the platform as a different role for QA testing
        </p>
      </CardContent>
    </Card>
  );
}
