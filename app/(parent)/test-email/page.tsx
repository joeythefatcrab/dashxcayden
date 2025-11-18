"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    configured?: boolean;
    error?: string;
    details?: string;
  } | null>(null);

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });

      const data = await response.json();

      setResult({
        success: response.ok,
        message: data.message || data.error,
        configured: data.configured,
        error: data.error,
        details: data.details,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: "Failed to send test email",
        error: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Test Email Setup
          </CardTitle>
          <CardDescription>
            Send a test email to verify your Resend configuration is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Status */}
          <div className="p-4 bg-accent rounded-lg">
            <h3 className="font-medium mb-2">Configuration Checklist</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs">1</span>
                </div>
                <span>Sign up at <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">resend.com</a></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs">2</span>
                </div>
                <span>Create an API key in your Resend dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs">3</span>
                </div>
                <span>Add <code className="bg-muted px-1 rounded">RESEND_API_KEY</code> to <code className="bg-muted px-1 rounded">.env.local</code></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs">4</span>
                </div>
                <span>Restart your dev server</span>
              </div>
            </div>
          </div>

          {/* Test Email Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Test Email Address (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com (leave blank to use your account email)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                If left blank, the test email will be sent to your logged-in account email
              </p>
            </div>

            <Button
              onClick={handleSendTestEmail}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success
                  ? "bg-green-50 border-green-200"
                  : result.configured === false
                  ? "bg-orange-50 border-orange-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : result.configured === false ? (
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      result.success
                        ? "text-green-800"
                        : result.configured === false
                        ? "text-orange-800"
                        : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.details}
                    </p>
                  )}
                  {result.success && (
                    <p className="text-sm text-green-700 mt-2">
                      Check your email inbox! You should receive a test email shortly.
                    </p>
                  )}
                  {result.configured === false && (
                    <div className="mt-3 text-sm text-orange-800">
                      <p className="font-medium mb-2">To configure Resend:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open <code className="bg-orange-100 px-1 rounded">.env.local</code></li>
                        <li>Replace <code className="bg-orange-100 px-1 rounded">re_YOUR_API_KEY_HERE</code> with your actual Resend API key</li>
                        <li>Restart your development server</li>
                        <li>Try sending the test email again</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Environment Info */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted rounded">
            <p className="font-medium">Current Configuration:</p>
            <p>Resend Configured: {process.env.NEXT_PUBLIC_APP_URL ? "Unknown (check after sending test)" : "Unknown"}</p>
            <p className="text-xs opacity-70">
              Note: Actual configuration status will be shown after attempting to send a test email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
