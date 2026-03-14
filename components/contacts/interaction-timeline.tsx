"use client";

import { motion } from "framer-motion";
import {
  Phone,
  Users,
  MessageSquare,
  Mail,
  MoreHorizontal,
  Star,
  Clock,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Interaction } from "@/lib/types";

const INTERACTION_TYPE_CONFIG = {
  call: { icon: Phone, color: "text-blue-400", bgColor: "bg-blue-400/10", borderColor: "border-blue-400/30", label: "Phone Call" },
  meeting: { icon: Users, color: "text-purple-400", bgColor: "bg-purple-400/10", borderColor: "border-purple-400/30", label: "Meeting" },
  message: { icon: MessageSquare, color: "text-cyan-400", bgColor: "bg-cyan-400/10", borderColor: "border-cyan-400/30", label: "Message" },
  email: { icon: Mail, color: "text-amber-400", bgColor: "bg-amber-400/10", borderColor: "border-amber-400/30", label: "Email" },
  other: { icon: MoreHorizontal, color: "text-gray-400", bgColor: "bg-gray-400/10", borderColor: "border-gray-400/30", label: "Other" },
};

interface InteractionTimelineProps {
  interactions: Interaction[];
  onLogInteraction: () => void;
}

export function InteractionTimeline({
  interactions,
  onLogInteraction,
}: InteractionTimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border bg-card"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold tracking-tight">Interactions</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {interactions.length}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={onLogInteraction} className="gap-1.5 text-xs">
          Log New
        </Button>
      </div>

      {/* Timeline */}
      <div className="p-5">
        {interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No interactions yet. Log your first interaction.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onLogInteraction}
              className="mt-3"
            >
              Log First Interaction
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-1">
              {interactions.map((interaction, index) => {
                const config = INTERACTION_TYPE_CONFIG[interaction.type];
                const Icon = config.icon;
                const dateStr = new Date(interaction.date).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );

                return (
                  <motion.div
                    key={interaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="group relative flex gap-4 pb-4"
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                        config.bgColor,
                        config.borderColor
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 rounded-lg border bg-card p-3 transition-colors group-hover:bg-muted/30">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className={cn("text-sm font-medium", config.color)}>
                          {config.label}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {dateStr}
                        </span>
                      </div>

                      {/* Meta row: quality + duration */}
                      <div className="flex flex-wrap items-center gap-3">
                        {interaction.quality_rating && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3 w-3",
                                  star <= interaction.quality_rating!
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                          </div>
                        )}
                        {interaction.duration_min && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{interaction.duration_min} min</span>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {interaction.notes && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {interaction.notes}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
