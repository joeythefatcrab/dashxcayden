"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RotateCcw, X } from "lucide-react";

export function FloatingExitQA() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // @ts-ignore - Check if impersonating
  const isImpersonating = session?.user?.isImpersonating || false;
  // @ts-ignore - Get impersonated role
  const currentRole = session?.user?.role || "";
  // @ts-ignore - Get real role
  const realRole = session?.user?.realRole || "";

  // Debug logging
  useEffect(() => {
    if (session?.user) {
      console.log("FloatingExitQA - Session data:", {
        role: session.user.role,
        // @ts-ignore
        isImpersonating: session.user.isImpersonating,
        // @ts-ignore
        realRole: session.user.realRole,
      });
    }
  }, [session]);

  // Don't show if not logged in or session is loading
  if (status === "loading" || !session?.user) {
    return null;
  }

  // Only show if actually impersonating
  if (!isImpersonating && realRole !== "SUPERADMIN") {
    return null;
  }

  const handleExitQAMode = async () => {
    setIsExiting(true);
    try {
      const response = await fetch("/api/superadmin/impersonate", {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/superadmin/overview");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to exit QA mode:", error);
      setIsExiting(false);
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-all hover:bg-orange-700 hover:scale-110"
        title="Expand QA Mode indicator"
      >
        <RotateCcw className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {/* QA Mode Indicator */}
      <div className="flex items-center gap-3 rounded-lg bg-orange-600 px-4 py-3 text-white shadow-lg">
        <div className="flex flex-col">
          <span className="text-xs font-medium opacity-90">QA Mode Active</span>
          <span className="text-sm font-bold">Viewing as {currentRole}</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="ml-2 rounded p-1 hover:bg-orange-700"
          title="Minimize"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Exit Button */}
      <button
        onClick={handleExitQAMode}
        disabled={isExiting}
        className="flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-orange-700 shadow-lg transition-all hover:bg-orange-50 disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" />
        {isExiting ? "Exiting..." : "Exit QA Mode"}
      </button>
    </div>
  );
}
