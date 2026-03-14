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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Users,
  MessageSquare,
  Mail,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { logInteraction } from "@/lib/queries";
import { cn } from "@/lib/utils";

const INTERACTION_TYPE_OPTIONS = [
  { value: "call" as const, label: "Call", icon: Phone, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  { value: "meeting" as const, label: "Meeting", icon: Users, color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  { value: "message" as const, label: "Message", icon: MessageSquare, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  { value: "email" as const, label: "Email", icon: Mail, color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  { value: "other" as const, label: "Other", icon: MoreHorizontal, color: "text-gray-400 bg-gray-400/10 border-gray-400/30" },
];

interface LogInteractionDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged: () => void;
}

export function LogInteractionDialog({
  contactId,
  open,
  onOpenChange,
  onLogged,
}: LogInteractionDialogProps) {
  const [type, setType] = useState<"call" | "meeting" | "message" | "email" | "other">("call");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [quality, setQuality] = useState<number>(0);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setType("call");
    setDate(new Date().toISOString().split("T")[0]);
    setQuality(0);
    setDuration("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await logInteraction({
        contact_id: contactId,
        type,
        date,
        quality_rating: quality > 0 ? quality : null,
        duration_min: duration ? parseInt(duration, 10) : null,
        notes: notes.trim() || null,
      });
      resetForm();
      onOpenChange(false);
      onLogged();
    } catch (error) {
      console.error("Failed to log interaction:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
          <DialogDescription>
            Record a recent interaction with this contact.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Interaction Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {INTERACTION_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200",
                      selected
                        ? cn(opt.color, "border-current shadow-sm")
                        : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[10px] font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="interaction-date">Date</Label>
            <Input
              id="interaction-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Quality Rating */}
          <div className="space-y-2">
            <Label>Quality</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQuality(quality === star ? 0 : star)}
                  className="rounded-sm p-0.5 transition-colors hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      star <= quality
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
              {quality > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {quality}/5
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="interaction-duration">Duration (minutes)</Label>
            <Input
              id="interaction-duration"
              type="number"
              min={1}
              placeholder="e.g. 30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="interaction-notes">Notes</Label>
            <Textarea
              id="interaction-notes"
              placeholder="What did you talk about?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "Logging..." : "Log Interaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
