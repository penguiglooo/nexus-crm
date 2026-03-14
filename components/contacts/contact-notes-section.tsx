"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info,
  Heart,
  User,
  FileText,
  X,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteContactNote } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { ContactNote } from "@/lib/types";

const NOTE_TYPE_CONFIG = {
  fact: { label: "Facts", icon: Info, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/20" },
  preference: { label: "Preferences", icon: Heart, color: "text-pink-400", bgColor: "bg-pink-400/10", borderColor: "border-pink-400/20" },
  personality: { label: "Personality", icon: User, color: "text-purple-400", bgColor: "bg-purple-400/10", borderColor: "border-purple-400/20" },
  context: { label: "Context", icon: FileText, color: "text-emerald-400", bgColor: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
};

interface ContactNotesSectionProps {
  notes: ContactNote[];
  onAddNote: () => void;
  onNoteDeleted: () => void;
}

export function ContactNotesSection({
  notes,
  onAddNote,
  onNoteDeleted,
}: ContactNotesSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteNote(id: string) {
    setDeletingId(id);
    try {
      await deleteContactNote(id);
      onNoteDeleted();
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setDeletingId(null);
    }
  }

  // Group notes by type
  const groupedNotes = notes.reduce(
    (acc, note) => {
      if (!acc[note.note_type]) acc[note.note_type] = [];
      acc[note.note_type].push(note);
      return acc;
    },
    {} as Record<string, ContactNote[]>
  );

  const noteTypeOrder: (keyof typeof NOTE_TYPE_CONFIG)[] = [
    "fact",
    "preference",
    "personality",
    "context",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border bg-card"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight">AI Notes</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {notes.length}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onAddNote} className="gap-1.5 text-xs">
          Add Note
        </Button>
      </div>

      {/* Notes Content */}
      <div className="p-5">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <Brain className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No notes yet. Add important details about this contact.
            </p>
            <Button size="sm" variant="outline" onClick={onAddNote} className="mt-3">
              Add First Note
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {noteTypeOrder.map((type) => {
                const typeNotes = groupedNotes[type];
                if (!typeNotes || typeNotes.length === 0) return null;

                const config = NOTE_TYPE_CONFIG[type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={type}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {/* Type Header */}
                    <div className="mb-2.5 flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                      </div>
                      <h3 className="text-sm font-medium">{config.label}</h3>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 pl-8">
                      {typeNotes.map((note) => (
                        <motion.div
                          key={note.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "group relative rounded-lg border p-3 transition-colors",
                            config.borderColor,
                            "hover:bg-muted/30"
                          )}
                        >
                          <p className="pr-6 text-sm leading-relaxed">
                            {note.content}
                          </p>
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingId === note.id}
                            className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
