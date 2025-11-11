"use client";

import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { Info } from "lucide-react";

interface GlossaryHoverProps {
  term: string;
  definition: string;
  derivation?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  children: React.ReactNode;
}

export function GlossaryHover({
  term,
  definition,
  derivation,
  mediaUrl,
  mediaType,
  children,
}: GlossaryHoverProps) {
  return (
    <HoverCardPrimitive.Root openDelay={200}>
      <HoverCardPrimitive.Trigger asChild>
        <span className="cursor-help border-b-2 border-dotted border-primary text-primary">
          {children}
        </span>
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="z-50 w-80 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={5}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold">{term}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{definition}</p>
              </div>
            </div>

            {derivation && (
              <div className="rounded-md bg-accent p-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Etymology: </span>
                  {derivation}
                </p>
              </div>
            )}

            {mediaUrl && mediaType === "image" && (
              <img
                src={mediaUrl}
                alt={term}
                className="h-auto w-full rounded-md border"
              />
            )}

            {mediaUrl && mediaType === "video" && (
              <video
                src={mediaUrl}
                controls
                className="h-auto w-full rounded-md border"
              />
            )}
          </div>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
