"use client";

import { motion } from "framer-motion";
import { Activity, Phone, Users, MessageSquare, Mail, MoreHorizontal, Star } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Contact, Interaction } from "@/lib/types";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  meeting: Users,
  message: MessageSquare,
  email: Mail,
  other: MoreHorizontal,
};

const typeColors: Record<string, string> = {
  call: "text-blue-500 bg-blue-500/10",
  meeting: "text-purple-500 bg-purple-500/10",
  message: "text-emerald-500 bg-emerald-500/10",
  email: "text-cyan-500 bg-cyan-500/10",
  other: "text-gray-500 bg-gray-500/10",
};

export function RecentInteractions({ interactions }: { interactions: (Interaction & { contact: Contact })[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-emerald-500" />
            Recent Interactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No interactions recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {interactions.map((interaction) => {
                const Icon = typeIcons[interaction.type] || MoreHorizontal;
                const colorClasses = typeColors[interaction.type] || typeColors.other;

                return (
                  <Link
                    key={interaction.id}
                    href={`/contacts/${interaction.contact_id}`}
                    className="group flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50"
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", colorClasses)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate group-hover:text-emerald-500 transition-colors">
                          {interaction.contact?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs capitalize text-muted-foreground">
                          {interaction.type}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground/60">
                        {formatRelativeTime(interaction.date)}
                      </span>
                    </div>
                    {interaction.quality_rating != null && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={cn(
                              "h-3 w-3",
                              idx < interaction.quality_rating!
                                ? "fill-amber-500 text-amber-500"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
