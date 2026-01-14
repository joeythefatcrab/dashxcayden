"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Copy, Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface SignupCodeManagerProps {
  currentCode: string;
}

export function SignupCodeManager({ currentCode }: SignupCodeManagerProps) {
  const router = useRouter();
  const [code, setCode] = useState(currentCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/superadmin/update-signup-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update code");
      }

      setSuccess(true);
      router.refresh();
    } catch (error: any) {
      console.error("Update code error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Signup Access Code</CardTitle>
        </div>
        <CardDescription>
          Control who can create new accounts on the platform. Users must enter this code to access the signup page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                type="text"
                placeholder="Enter signup code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                disabled={isLoading}
                className="font-mono text-lg"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generateRandomCode}
                disabled={isLoading}
                title="Generate random code"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={!code || isLoading}
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this code with users you want to grant signup access. The code is case-insensitive.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
              Signup code updated successfully!
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !code}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Code"
              )}
            </Button>
          </div>
        </form>

        {currentCode && (
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium">Current Active Code:</p>
            <div className="flex items-center gap-2">
              <code className="rounded bg-background px-3 py-2 font-mono text-lg font-semibold">
                {currentCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(currentCode);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
