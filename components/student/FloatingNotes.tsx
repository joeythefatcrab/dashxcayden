"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Note = {
  id: string;
  title: string | null;
  content: string;
  lessonId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  studentId: string;
  currentLessonId?: string | null;
  currentLessonTitle?: string | null;
};

export function FloatingNotes({
  studentId,
  currentLessonId,
  currentLessonTitle,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoopiOpen, setIsLoopiOpen] = useState(false);

  // New note form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [linkToLesson, setLinkToLesson] = useState(false);

  // Edit note state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Listen for Loopi open/close events
  useEffect(() => {
    const handleLoopiChange = (e: CustomEvent) => {
      setIsLoopiOpen(e.detail.isOpen);
    };

    window.addEventListener("loopi-state-change" as any, handleLoopiChange);

    const loopiState = localStorage.getItem("loopi-open");
    setIsLoopiOpen(loopiState === "true");

    return () => {
      window.removeEventListener("loopi-state-change" as any, handleLoopiChange);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/student/notes?studentId=${studentId}`
      );

      if (!response.ok) throw new Error("Failed to load notes");

      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newContent.trim()) return;

    try {
      const response = await fetch("/api/student/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title: newTitle.trim() || null,
          content: newContent.trim(),
          lessonId: linkToLesson && currentLessonId ? currentLessonId : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      setNewTitle("");
      setNewContent("");
      setLinkToLesson(false);
      setIsAdding(false);
      await loadNotes();
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch("/api/student/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: noteId,
          title: editTitle.trim() || null,
          content: editContent.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update note");

      setEditingId(null);
      setEditTitle("");
      setEditContent("");
      await loadNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      const response = await fetch(`/api/student/notes?id=${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");

      await loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title || "");
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rightPosition = isLoopiOpen ? "27rem" : "6rem";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl"
        aria-label="Open Notes"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: rightPosition,
          zIndex: 9998,
        }}
      >
        <StickyNote className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 z-[9998] flex h-[600px] w-[400px] flex-col rounded-lg border border-border bg-background shadow-2xl dark:border-gray-700 transition-all duration-300 ease-in-out"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: rightPosition,
        zIndex: 9998,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold">Notes</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close notes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className="border-b border-border dark:border-gray-700 p-4 bg-muted/50 dark:bg-muted/20">
          <div className="space-y-2">
            <Input
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Write your note..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              autoFocus
            />
            {currentLessonId && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={linkToLesson}
                  onChange={(e) => setLinkToLesson(e.target.checked)}
                  className="rounded"
                />
                <span>Link to: {currentLessonTitle || "Current Lesson"}</span>
              </label>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle("");
                  setNewContent("");
                  setLinkToLesson(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddNote} disabled={!newContent.trim()}>
                Add Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">
            Loading notes...
          </p>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <StickyNote className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No notes found" : "No notes yet"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click + to create your first note
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="p-3 hover:shadow-md transition-shadow"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Title (optional)"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-sm"
                  />
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editContent.trim()}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {note.title && (
                        <h4 className="font-semibold text-sm mb-1">{note.title}</h4>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(note)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  {note.lessonId && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      📚 Linked to lesson
                    </p>
                  )}
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
