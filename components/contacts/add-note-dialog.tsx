"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info, Heart, User, FileText } from "lucide-react";
import { addContactNote } from "@/lib/queries";
import { cn } from "@/lib/utils";

const NOTE_TYPE_OPTIONS = [
  { value: "fact" as const, label: "Fact", icon: Info, description: "Factual information", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { value: "preference" as const, label: "Preference", icon: Heart, description: "Likes/dislikes", color: "text-pink-400 bg-pink-400/10 border-pink-400/30" },
  { value: "personality" as const, label: "Personality", icon: User, description: "Character traits", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  { value: "context" as const, label: "Context", icon: FileText, description: "Situational context", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
];

interface AddNoteDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddNoteDialog({
  contactId,
  open,
  onOpenChange,
  onAdded,
}: AddNoteDialogProps) {
  const [noteType, setNoteType] = useState<"fact" | "preference" | "personality" | "context">("fact");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setNoteType("fact");
    setContent("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await addContactNote({
        contact_id: contactId,
        note_type: noteType,
        content: content.trim(),
      });
      resetForm();
      onOpenChange(false);
      onAdded();
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Save an important detail about this contact.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Note Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {NOTE_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = noteType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNoteType(opt.value)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all duration-200",
                      selected
                        ? cn(opt.color, "border-current shadow-sm")
                        : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div>
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[10px] opacity-70">{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              placeholder="What do you want to remember?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
