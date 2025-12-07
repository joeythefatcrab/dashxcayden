"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PARENT");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteUrl("");

    try {
      const response = await fetch("/api/superadmin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create invite");
        return;
      }

      setInviteUrl(data.inviteUrl);
      setEmail("");
    } catch (err) {
      setError("Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    alert("Invite link copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ADMIN">Admin</option>
              <option value="PARENT">Parent</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {inviteUrl && (
            <div className="space-y-2">
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm font-medium text-green-900 mb-2">
                  Invite created! Share this link:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 rounded border bg-white px-2 py-1 text-sm"
                  />
                  <Button
                    type="button"
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Invite..." : "Create Invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
