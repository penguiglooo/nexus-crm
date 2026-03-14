"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X, Clock, AlertTriangle, Calendar } from "lucide-react";
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
import type { Reminder, Contact } from "@/lib/types";

const reminderTypeConfig: Record<
  string,
  { label: string; className: string }
> = {
  frequency: {
    label: "Check-in",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  birthday: {
    label: "Birthday",
    className: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  custom: {
    label: "Custom",
    className: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
};

function getUrgency(dueDate: string): {
  label: string;
  className: string;
  icon: React.ReactNode;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`,
      className: "text-red-500",
      icon: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
    };
  }
  if (diffDays === 0) {
    return {
      label: "Due today",
      className: "text-amber-500",
      icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    };
  }
  return {
    label: `Due in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
    className: "text-muted-foreground",
    icon: <Calendar className="h-3.5 w-3.5 text-muted-foreground" />,
  };
}

interface ReminderCardProps {
  reminder: Reminder & { contact: Contact };
  index: number;
  onMarkDone: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function ReminderCard({
  reminder,
  index,
  onMarkDone,
  onDismiss,
}: ReminderCardProps) {
  const typeConfig =
    reminderTypeConfig[reminder.reminder_type] || reminderTypeConfig.custom;
  const urgency = getUrgency(reminder.due_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
    >
      <Card className="group relative overflow-hidden p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
        {/* Header: Contact Name + Type Badge */}
        <div className="mb-2 flex items-start justify-between">
          <Link
            href={`/contacts/${reminder.contact_id}`}
            className="font-semibold tracking-tight transition-colors hover:text-primary"
          >
            {reminder.contact?.name ?? "Unknown"}
          </Link>
          <Badge
            variant="outline"
            className={cn("shrink-0 text-[10px]", typeConfig.className)}
          >
            {typeConfig.label}
          </Badge>
        </div>

        {/* Urgency indicator */}
        <div className="mb-2 flex items-center gap-1.5">
          {urgency.icon}
          <span className={cn("text-xs font-medium", urgency.className)}>
            {urgency.label}
          </span>
        </div>

        {/* Message */}
        {reminder.message && (
          <p className="mb-3 text-sm text-muted-foreground">
            {reminder.message}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-border pt-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => onMarkDone(reminder.id)}
                >
                  <Check className="h-3 w-3" />
                  Done
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as done</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10"
                  onClick={() => onDismiss(reminder.id)}
                >
                  <X className="h-3 w-3" />
                  Dismiss
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dismiss reminder</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>
    </motion.div>
  );
}
