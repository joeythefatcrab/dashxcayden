"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, Plus, Trash2, Edit2, Save, X } from "lucide-react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesSectionProps {
  studentId: string;
  lessonId?: string;
  itemId?: string;
  title?: string;
}

export function NotesSection({ studentId, lessonId, itemId, title = "My Notes" }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    fetchNotes();
  }, [studentId, lessonId, itemId]);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams({ studentId });
      if (lessonId) params.append("lessonId", lessonId);
      if (itemId) params.append("itemId", itemId);

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
    if (!newNoteContent.trim()) return;

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          lessonId,
          itemId,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <StickyNote className="h-5 w-5" />
            {title}
          </CardTitle>
          {!isAdding && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Note */}
        {isAdding && (
          <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
            <Textarea
              placeholder="Write your note here..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                <Save className="mr-2 h-3 w-3" />
                Save Note
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
          <p className="text-sm text-muted-foreground">
            {isAdding ? "" : "No notes yet. Click 'Add Note' to create one."}
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border bg-card p-3">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
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
                    <p className="mb-2 whitespace-pre-wrap text-sm">{note.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.updatedAt).toLocaleDateString()} at{" "}
                        {new Date(note.updatedAt).toLocaleTimeString()}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(note)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
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
      </CardContent>
    </Card>
  );
}
