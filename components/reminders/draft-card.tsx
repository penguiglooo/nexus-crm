"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MessageDraft, Contact } from "@/lib/types";

const occasionConfig: Record<
  string,
  { label: string; className: string }
> = {
  birthday: {
    label: "Birthday",
    className: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  checkin: {
    label: "Check-in",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  followup: {
    label: "Follow-up",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  custom: {
    label: "Custom",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  dismissed: {
    label: "Dismissed",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
};

interface DraftCardProps {
  draft: MessageDraft & { contact: Contact };
  index: number;
  onApprove: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function DraftCard({
  draft,
  index,
  onApprove,
  onDismiss,
}: DraftCardProps) {
  const occasion = occasionConfig[draft.occasion] || occasionConfig.custom;
  const status = statusConfig[draft.status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      <Card className="group relative overflow-hidden border-border/60 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
        {/* Subtle gradient accent at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Header: Contact + Badges */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary/60" />
            <Link
              href={`/contacts/${draft.contact_id}`}
              className="font-semibold tracking-tight transition-colors hover:text-primary"
            >
              {draft.contact?.name ?? "Unknown"}
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn("text-[10px]", occasion.className)}
            >
              {occasion.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px]", status.className)}
            >
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Full draft text */}
        <div className="mb-3 rounded-md bg-muted/50 p-3">
          <p className="text-sm leading-relaxed text-foreground/80">
            {draft.draft_text}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => onApprove(draft.id)}
                >
                  <Check className="h-3 w-3" />
                  Approve
                </Button>
              </TooltipTrigger>
              <TooltipContent>Approve this draft</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10"
                  onClick={() => onDismiss(draft.id)}
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dismiss this draft</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>
    </motion.div>
  );
}
