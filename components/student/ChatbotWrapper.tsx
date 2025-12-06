"use client";

import { AIChatbot } from "./AIChatbot";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

export function ChatbotWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    console.log("ChatbotWrapper mounted");
    setIsMounted(true);
  }, []);

  // Always render a test div to see if component loads
  return (
    <>
      {/* Debug div - remove after testing */}
      <div
        style={{
          position: "fixed",
          bottom: "100px",
          right: "24px",
          background: "red",
          color: "white",
          padding: "8px",
          zIndex: 99999,
          fontSize: "12px",
        }}
      >
        Chatbot Wrapper: {isMounted ? "Mounted" : "Loading"}
      </div>

      {/* Simple test button */}
      <button
        onClick={() => alert("Button works!")}
        style={{
          position: "fixed",
          bottom: "160px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(to right, #2563eb, #9333ea)",
          color: "white",
          border: "none",
          cursor: "pointer",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
        <MessageCircle size={24} />
      </button>

      {/* Actual chatbot */}
      <div data-chatbot-wrapper="true">
        <AIChatbot />
      </div>
    </>
  );
}
