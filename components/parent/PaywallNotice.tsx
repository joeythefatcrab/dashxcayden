"use client";

import { useState } from "react";
import { X, CreditCard, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type UnpaidStudent = {
  id: string;
  name: string;
};

type Props = {
  unpaidStudents: UnpaidStudent[];
};

export function PaywallNotice({ unpaidStudents }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (unpaidStudents.length === 0) return null;

  const handleSubscribe = async (studentId: string) => {
    setLoadingId(studentId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoadingId(null);
    }
  };

  // After dismissing: unobtrusive inline banner
  if (dismissed) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 mb-4 text-sm">
        <div className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {unpaidStudents.length === 1
              ? `${unpaidStudents[0].name} doesn't have an active subscription.`
              : `${unpaidStudents.length} students don't have active subscriptions.`}
          </span>
        </div>
        <button
          onClick={() => handleSubscribe(unpaidStudents[0].id)}
          disabled={loadingId !== null}
          className="ml-4 flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium shrink-0 disabled:opacity-50"
        >
          {loadingId ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>Subscribe <ChevronRight className="h-3.5 w-3.5" /></>
          )}
        </button>
      </div>
    );
  }

  // Initial modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 pt-6 pb-5">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Subscription Required</h2>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {unpaidStudents.length === 1
              ? `${unpaidStudents[0].name} needs an active subscription to access lessons and courses.`
              : `${unpaidStudents.length} of your students need active subscriptions to access lessons and courses.`}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Student list with per-student subscribe buttons */}
          <div className="space-y-2">
            {unpaidStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-semibold text-amber-700">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{student.name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSubscribe(student.id)}
                  disabled={loadingId !== null}
                  className="h-7 text-xs"
                >
                  {loadingId === student.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Subscribe
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center">
            $129.99/month per student · Cancel anytime
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-500 hover:text-gray-700 text-xs"
            onClick={() => setDismissed(true)}
          >
            I'll do this later
          </Button>
        </div>
      </div>
    </div>
  );
}
