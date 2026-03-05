"use client";

import { useRouter } from "next/navigation";

interface SubscriptionGateProps {
  studentName?: string;
}

export function SubscriptionGate({ studentName }: SubscriptionGateProps) {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 50,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: "right",
        pointerEvents: "auto",
      }}
    >
      <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
        Activate Learnality
      </p>
      <p style={{ margin: "2px 0 6px 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        Go to Settings to activate{studentName ? ` for ${studentName}` : ""}.
      </p>
      <button
        onClick={() => router.push("/settings")}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 3,
          padding: "4px 12px",
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          cursor: "pointer",
        }}
      >
        Activate now
      </button>
    </div>
  );
}
