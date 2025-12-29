"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, X, Plus, Trash2, Edit2, Save } from "lucide-react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface FloatingNotesProps {
  studentId: string;
}

export function FloatingNotes({ studentId }: FloatingNotesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [isLoopiOpen, setIsLoopiOpen] = useState(false);

  // Detect current lesson from URL
  useEffect(() => {
    const path = window.location.pathname;
    const lessonMatch = path.match(/\/lessons\/([^\/]+)/);
    if (lessonMatch) {
      setCurrentLessonId(lessonMatch[1]);
    }
  }, []);

  // Listen for Loopi open/close events
  useEffect(() => {
    const handleLoopiChange = (e: CustomEvent) => {
      setIsLoopiOpen(e.detail.isOpen);
    };

    window.addEventListener('loopi-state-change' as any, handleLoopiChange);

    // Check initial state
    const loopiState = localStorage.getItem('loopi-open');
    setIsLoopiOpen(loopiState === 'true');

    return () => {
      window.removeEventListener('loopi-state-change' as any, handleLoopiChange);
    };
  }, []);

  useEffect(() => {
    if (isOpen && currentLessonId) {
      fetchNotes();
    }
  }, [isOpen, currentLessonId]);

  const fetchNotes = async () => {
    if (!currentLessonId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ studentId, lessonId: currentLessonId });
      const response = await fetch(`/api/notes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch notes");

      const data = await response.json();
      setNotes(data.notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !currentLessonId) return;

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          lessonId: currentLessonId,
          content: newNoteContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to create note");

      const data = await response.json();
      setNotes([data.note, ...notes]);
      setNewNoteContent("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note");
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) throw new Error("Failed to update note");

      const data = await response.json();
      setNotes(notes.map((n) => (n.id === noteId ? data.note : n)));
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");

      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const rightPosition = isLoopiOpen ? "27rem" : "6rem"; // Slide left when Loopi is open

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
    <div className="fixed bottom-6 z-[9998] flex h-[600px] w-[400px] flex-col rounded-lg border border-border bg-background shadow-2xl dark:border-gray-700 transition-all duration-300 ease-in-out"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: rightPosition,
        zIndex: 9998,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          <h3 className="font-semibold">My Notes</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 hover:bg-white/20 transition-colors"
          aria-label="Close notes"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentLessonId ? (
          <p className="text-sm text-muted-foreground">
            Navigate to a lesson to take notes
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : (
          <>
            {/* Add New Note Button */}
            {!isAdding && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(true)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            )}

            {/* Add New Note Form */}
            {isAdding && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 dark:bg-muted/20 p-3">
                <Textarea
                  placeholder="Write your note here..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                  className="resize-none text-sm bg-background dark:bg-gray-800"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                    <Save className="mr-2 h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false);
                      setNewNoteContent("");
                    }}
                  >
                    <X className="mr-2 h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Existing Notes */}
            {notes.length === 0 ? (
              !isAdding && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes yet. Click 'Add Note' to create one.
                </p>
              )
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border bg-card dark:bg-gray-800 p-3 shadow-sm">
                    {editingId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="resize-none text-sm bg-background dark:bg-gray-700"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateNote(note.id)} disabled={!editContent.trim()}>
                            <Save className="mr-2 h-3 w-3" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEdit}>
                            <X className="mr-2 h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mb-2 whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(note)} className="h-7 w-7 p-0">
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)} className="h-7 w-7 p-0">
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
