"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, X, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ReportSubmissionBanner() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // @ts-ignore
  const role = session?.user?.realRole || session?.user?.role;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    const poll = () => {
      fetch("/api/admin/pending-reports")
        .then((r) => r.json())
        .then((d) => {
          const n = d.count || 0;
          setCount(n);
          if (n > 0 && !dismissed) setVisible(true);
        })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [isAdmin, dismissed]);

  // Re-show if new reports come in after a dismiss
  useEffect(() => {
    if (count > 0 && dismissed) {
      setDismissed(false);
      setVisible(true);
    }
  }, [count]);

  const handleDismiss = async () => {
    setVisible(false);
    setDismissed(true);
    // Mark all as reviewed so they don't pop back up
    await fetch("/api/admin/mark-report-reviewed", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
    setCount(0);
  };

  if (!isAdmin || !visible || count === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <FileText className="h-5 w-5 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {count === 1 ? "1 new report submitted" : `${count} new reports submitted`}
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          {count === 1 ? "A parent has submitted their monthly report." : "Parents have submitted their monthly reports."}
        </p>
        <Link
          href="/monthly-reports"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-800 underline-offset-2 hover:underline"
          onClick={handleDismiss}
        >
          View reports <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-amber-500 hover:text-amber-800 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
