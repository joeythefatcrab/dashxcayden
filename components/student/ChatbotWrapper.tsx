"use client";

import { AIChatbot } from "./AIChatbot";
import { useEffect } from "react";

export function ChatbotWrapper() {
  useEffect(() => {
    console.log("ChatbotWrapper mounted");
  }, []);

  return (
    <div data-chatbot-wrapper="true">
      <AIChatbot />
    </div>
  );
}
