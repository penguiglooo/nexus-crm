"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  Clock,
  MessageSquarePlus,
  FilePlus,
  Pencil,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HealthBadge } from "@/components/shared/health-badge";
import { cn, getCategoryColor, formatRelativeTime } from "@/lib/utils";
import { FREQUENCY_GOALS } from "@/lib/constants";
import { deleteContact } from "@/lib/queries";
import type { ContactWithHealth } from "@/lib/types";

interface ContactHeaderProps {
  contact: ContactWithHealth;
  onLogInteraction: () => void;
  onAddNote: () => void;
  onEdit: () => void;
}

export function ContactHeader({
  contact,
  onLogInteraction,
  onAddNote,
  onEdit,
}: ContactHeaderProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<"phone" | "email" | null>(null);

  const frequencyLabel = FREQUENCY_GOALS.find(
    (f) => f.value === contact.frequency_goal
  )?.label;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteContact(contact.id);
      router.push("/contacts");
    } catch (error) {
      console.error("Failed to delete contact:", error);
    } finally {
      setDeleting(false);
    }
  }

  function handleCopy(value: string, field: "phone" | "email") {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border bg-card p-6"
      >
        {/* Back button */}
        <button
          onClick={() => router.push("/contacts")}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contacts
        </button>

        {/* Top row: Name + Category + Health */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
            <Badge
              variant="outline"
              className={cn("text-xs", getCategoryColor(contact.category))}
            >
              {contact.category}
            </Badge>
            <HealthBadge health={contact.health} />
          </div>
        </div>

        {/* Info row */}
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {contact.phone && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleCopy(contact.phone!, "phone")}
                    className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{contact.phone}</span>
                    {copiedField === "phone" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copiedField === "phone" ? "Copied!" : "Click to copy"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {contact.email && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleCopy(contact.email!, "email")}
                    className="flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>{contact.email}</span>
                    {copiedField === "email" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copiedField === "email" ? "Copied!" : "Click to copy"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {frequencyLabel && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{frequencyLabel}</span>
            </div>
          )}

          {contact.last_interaction_at && (
            <span className="text-xs">
              Last contact: {formatRelativeTime(contact.last_interaction_at)}
            </span>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onLogInteraction} className="gap-1.5">
            <MessageSquarePlus className="h-4 w-4" />
            Log Interaction
          </Button>
          <Button size="sm" variant="outline" onClick={onAddNote} className="gap-1.5">
            <FilePlus className="h-4 w-4" />
            Add Note
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {contact.name}? This action cannot
              be undone. All notes and interactions will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
