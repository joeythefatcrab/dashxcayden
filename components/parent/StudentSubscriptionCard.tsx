"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  name: string;
  subscriptionActive: boolean;
  subscriptionEndDate: string | null;
};

type Props = {
  students: Student[];
  hasAnySubscription: boolean;
};

export function StudentSubscriptionCard({ students, hasAnySubscription }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (studentId: string) => {
    setLoading(studentId);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Subscription error:", error);
      alert(error instanceof Error ? error.message : "Failed to start subscription");
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading("billing");

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      // Redirect to Stripe Billing Portal
      window.location.href = data.url;
    } catch (error) {
      console.error("Billing portal error:", error);
      alert(error instanceof Error ? error.message : "Failed to open billing portal");
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Learnality Pro Subscriptions</CardTitle>
            <CardDescription>
              $129.99/month per student for unlimited access
            </CardDescription>
          </div>
          {hasAnySubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageBilling}
              disabled={loading === "billing"}
            >
              {loading === "billing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{student.name}</p>
                    {student.subscriptionActive ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {student.subscriptionEndDate && (
                    <p className="text-sm text-muted-foreground">
                      {student.subscriptionActive
                        ? `Renews ${new Date(student.subscriptionEndDate).toLocaleDateString()}`
                        : `Expired ${new Date(student.subscriptionEndDate).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>

              {!student.subscriptionActive && (
                <Button
                  onClick={() => handleSubscribe(student.id)}
                  disabled={loading === student.id}
                  size="sm"
                >
                  {loading === student.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Subscribe
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        {students.every((s) => !s.subscriptionActive) && (
          <div className="mt-6 rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Students need an active subscription to access lessons and courses.
              Click "Subscribe" to get started with Learnality Pro.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
