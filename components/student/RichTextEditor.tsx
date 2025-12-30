"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  disabled = false,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatButtons = [
    { icon: Bold, command: "bold", label: "Bold" },
    { icon: Italic, command: "italic", label: "Italic" },
    { icon: Underline, command: "underline", label: "Underline" },
  ];

  const alignButtons = [
    { icon: AlignLeft, command: "justifyLeft", label: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", label: "Align Center" },
    { icon: AlignRight, command: "justifyRight", label: "Align Right" },
  ];

  const listButtons = [
    { icon: List, command: "insertUnorderedList", label: "Bullet List" },
    { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
  ];

  return (
    <div className="rounded-lg border border-border bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-muted/30">
        {formatButtons.map(({ icon: Icon, command, label }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand(command)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        {alignButtons.map(({ icon: Icon, command, label }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand(command)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        {listButtons.map(({ icon: Icon, command, label }) => (
          <Button
            key={command}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand(command)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          min-h-[200px] p-4 outline-none prose prose-sm max-w-none
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${isFocused ? "ring-2 ring-primary ring-opacity-50" : ""}
        `}
        style={{
          overflowWrap: "break-word",
          wordWrap: "break-word",
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
    </div>
  );
}
