"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCodeParam = searchParams.get("invite");

  const [isValidated, setIsValidated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [inviteRole, setInviteRole] = useState<string | null>(null); // role from invite code
  const [inviteLabel, setInviteLabel] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        if (inviteCodeParam) {
          // Validate invite code and get preset role
          const res = await fetch(`/api/auth/invite-code?code=${encodeURIComponent(inviteCodeParam)}`);
          const data = await res.json();
          if (!res.ok || !data.valid) {
            setInviteError(data.error || "Invalid invite code");
            setIsChecking(false);
            return;
          }
          setInviteRole(data.role);
          setInviteLabel(data.label);
          setRole(data.role);
          setIsValidated(true);
        } else {
          // Fall back to signup-code gate
          const res = await fetch("/api/auth/check-signup-validation");
          const data = await res.json();
          if (!data.validated) {
            router.push("/signup-gate");
            return;
          }
          setIsValidated(true);
        }
      } catch {
        if (!inviteCodeParam) router.push("/signup-gate");
      } finally {
        setIsChecking(false);
      }
    };
    check();
  }, [inviteCodeParam, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{inviteError}</div>
            <p className="text-sm text-muted-foreground">
              Contact your administrator for a new invite link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          role,
          inviteCode: inviteCodeParam || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          throw new Error("This email is already registered. Please sign in instead or use a different email.");
        }
        throw new Error(data.error || "Sign up failed");
      }

      router.push("/sign-in?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            {inviteLabel
              ? `You've been invited as ${inviteRole?.toLowerCase()} — ${inviteLabel}`
              : inviteRole
              ? `You've been invited to join as ${inviteRole?.toLowerCase()}`
              : "Enter your details to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* If invite code sets the role, show it read-only */}
            {inviteRole ? (
              <div className="space-y-2">
                <Label>Account type</Label>
                <div className="rounded-md border px-3 py-2 text-sm bg-muted/50">
                  {inviteRole === "PARENT" ? "Parent/Guardian" : inviteRole === "STUDENT" ? "Student" : inviteRole}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select value={role} onValueChange={setRole} required disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PARENT">Parent/Guardian</SelectItem>
                    <SelectItem value="STUDENT">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !role}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
