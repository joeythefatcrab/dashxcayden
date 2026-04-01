"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";

export function EditUserName({ userId, initialName }: { userId: string; initialName: string | null }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/superadmin/update-user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, name }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
    }
  };

  const cancel = () => {
    setName(initialName || "");
    setEditing(false);
    setError("");
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 group">
        <p className="font-medium text-gray-900">{name || <span className="italic text-gray-400">No name</span>}</p>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700"
          title="Edit name"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="rounded border px-2 py-0.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary w-48"
          disabled={saving}
        />
        <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700" title="Save">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={cancel} disabled={saving} className="text-gray-400 hover:text-gray-600" title="Cancel">
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
