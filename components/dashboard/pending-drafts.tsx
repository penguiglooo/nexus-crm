"use client";

import { motion } from "framer-motion";
import { FileText, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateDraft } from "@/lib/queries";
import type { Contact, MessageDraft } from "@/lib/types";

const occasionColors: Record<string, string> = {
  birthday: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  checkin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  followup: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  custom: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface PendingDraftsProps {
  drafts: (MessageDraft & { contact: Contact })[];
  onUpdate: () => void;
}

export function PendingDrafts({ drafts, onUpdate }: PendingDraftsProps) {
  async function handleApprove(id: string) {
    try {
      await updateDraft(id, { status: "approved" });
      onUpdate();
    } catch (err) {
      console.error("Failed to approve draft:", err);
    }
  }

  async function handleDismiss(id: string) {
    try {
      await updateDraft(id, { status: "dismissed" });
      onUpdate();
    } catch (err) {
      console.error("Failed to dismiss draft:", err);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4 text-blue-500" />
            Pending Drafts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No pending message drafts.
            </p>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-lg border border-border/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {draft.contact?.name ?? "Unknown"}
                      </span>
                      <Badge
                        variant="outline"
                        className={occasionColors[draft.occasion] || occasionColors.custom}
                      >
                        {draft.occasion}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {draft.draft_text}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={() => handleApprove(draft.id)}
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10"
                      onClick={() => handleDismiss(draft.id)}
                    >
                      <X className="h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
