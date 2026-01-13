"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Eye, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface ImpersonateUserListProps {
  users: User[];
}

export function ImpersonateUserList({ users }: ImpersonateUserListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = async (userId: string) => {
    setImpersonating(userId);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Force a full page reload to ensure session is refreshed properly
        window.location.href = "/dashboard";
      } else {
        const data = await response.json();
        console.error("Impersonation failed:", { status: response.status, data });
        alert(`Failed to impersonate: ${data.error || "Unknown error"}`);
        setImpersonating(null);
      }
    } catch (error) {
      console.error("Impersonation error:", error);
      alert("Failed to impersonate user");
      setImpersonating(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "destructive";
      case "ADMIN":
        return "default";
      case "PARENT":
        return "secondary";
      case "STUDENT":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email, name, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {user.name || user.email}
                  </CardTitle>
                  {user.name && (
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleImpersonate(user.id)}
                    disabled={impersonating === user.id}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {impersonating === user.id ? "Impersonating..." : "Impersonate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No users found matching your search.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
