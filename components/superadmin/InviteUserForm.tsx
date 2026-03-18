"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/superadmin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create admin");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail("");
    setName("");
    setPassword("");
    setSuccess(false);
    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Admin</CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-green-900">Admin account created. Share these credentials:</p>
              <div className="rounded bg-white border p-3 text-sm space-y-1 font-mono">
                <p><span className="text-gray-500">Email:</span> {email}</p>
                <p><span className="text-gray-500">Password:</span> {password}</p>
              </div>
              <p className="text-xs text-green-700">Tell them to sign in at /sign-in and change their password after first login.</p>
            </div>
            <Button variant="outline" onClick={handleReset} className="w-full">
              Create Another Admin
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a temporary password"
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Admin Account"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
