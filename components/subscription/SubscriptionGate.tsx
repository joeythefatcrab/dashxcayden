"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SubscriptionGateProps {
  studentName?: string;
}

export function SubscriptionGate({ studentName }: SubscriptionGateProps) {
  const router = useRouter();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [shakeCount, setShakeCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [okClicks, setOkClicks] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Center on mount
  useEffect(() => {
    setPosition({
      x: window.innerWidth / 2 - 220,
      y: window.innerHeight / 2 - 160,
    });
  }, []);

  const handleOkClick = () => {
    const next = okClicks + 1;
    setOkClicks(next);
    setIsShaking(true);
    setShakeCount((c) => c + 1);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dialogRef.current) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, dragOffset]);

  const okMessages = [
    "Click OK to continue.",
    "Please click OK.",
    "Have you tried clicking OK?",
    "This is not a bug, it's a feature.",
    "OK means OK. Subscribe means subscribe.",
    "Your parent will know what to do.",
    "Still here? Impressive.",
    "This dialog will remain open.",
    "We admire your persistence.",
    "Subscribing is the only escape.",
  ];

  const currentMessage = okMessages[Math.min(okClicks, okMessages.length - 1)];

  return (
    <>
      {/* Blurred overlay - blocks all interaction with page beneath */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backdropFilter: "blur(6px)",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Windows-style dialog */}
      <div
        ref={dialogRef}
        className={isShaking ? "animate-shake" : ""}
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 60,
          width: 440,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          boxShadow: "4px 4px 12px rgba(0,0,0,0.6), inset 0 0 0 1px #fff3",
          userSelect: "none",
        }}
      >
        {/* Title bar */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            background: "linear-gradient(to right, #0078d4, #005a9e)",
            color: "white",
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: isDragging ? "grabbing" : "grab",
            borderRadius: "6px 6px 0 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Learnality – Subscription Required
            </span>
          </div>
          {/* Fake close button that does nothing */}
          <button
            onClick={handleOkClick}
            style={{
              background: "#c42b1c",
              border: "none",
              color: "white",
              width: 22,
              height: 22,
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            background: "#f3f3f3",
            padding: "20px 24px",
            borderLeft: "2px solid #ccc",
            borderRight: "2px solid #ccc",
          }}
        >
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* Big warning icon */}
            <div
              style={{
                fontSize: 42,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              🚫
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#1a1a1a",
                }}
              >
                No active subscription detected
              </p>
              <p style={{ margin: "0 0 6px 0", fontSize: 13, color: "#333", lineHeight: 1.5 }}>
                {studentName ? `Hi ${studentName} — your` : "Your"} account does not have an
                active subscription. Please ask your parent or guardian to
                subscribe to continue using Learnality.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>{currentMessage}</p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div
          style={{
            background: "#e8e8e8",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            borderLeft: "2px solid #ccc",
            borderRight: "2px solid #ccc",
            borderBottom: "2px solid #ccc",
            borderRadius: "0 0 6px 6px",
          }}
        >
          <button
            onClick={handleOkClick}
            style={{
              background: "#e1e1e1",
              border: "1px solid #adadad",
              borderRadius: 3,
              padding: "5px 20px",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 75,
            }}
          >
            OK
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "#e1e1e1",
              border: "1px solid #adadad",
              borderRadius: 3,
              padding: "5px 20px",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 75,
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/settings")}
            style={{
              background: "#0078d4",
              border: "1px solid #005a9e",
              borderRadius: 3,
              padding: "5px 20px",
              fontSize: 13,
              cursor: "pointer",
              color: "white",
              fontWeight: 600,
              minWidth: 100,
            }}
          >
            Subscribe Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px) rotate(-1deg); }
          30% { transform: translateX(8px) rotate(1deg); }
          45% { transform: translateX(-6px) rotate(-0.5deg); }
          60% { transform: translateX(6px) rotate(0.5deg); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
}
