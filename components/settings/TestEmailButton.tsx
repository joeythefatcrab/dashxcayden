"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function TestEmailButton({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const send = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Test email sent to ${email}` });
      } else {
        setResult({ ok: false, message: data.error || "Failed to send" });
      }
    } catch {
      setResult({ ok: false, message: "Network error — please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="test-email-addr" className="sr-only">Email address</Label>
          <Input
            id="test-email-addr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <Button onClick={send} disabled={loading || !email} className="gap-2 shrink-0">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</>
            : <><Mail className="h-4 w-4" />Send Test</>}
        </Button>
      </div>
      {result && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${result.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {result.ok
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {result.message}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Requires <code className="bg-muted px-1 rounded">RESEND_API_KEY</code> to be set in your environment.
      </p>
    </div>
  );
}
