"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthBadge } from "@/components/shared/health-badge";
import { getCategoryColor } from "@/lib/utils";
import type { ContactWithHealth } from "@/lib/types";

export function NeedsAttention({ contacts }: { contacts: ContactWithHealth[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              All caught up! No contacts need attention.
            </p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium group-hover:text-emerald-500 transition-colors">
                        {contact.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={getCategoryColor(contact.category)}
                      >
                        {contact.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HealthBadge health={contact.health} />
                      {contact.frequency_goal && (
                        <span className="text-muted-foreground/60">
                          Goal: {contact.frequency_goal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {contact.days_overdue != null && (
                      <span className="font-mono text-sm font-semibold text-red-500">
                        {contact.days_overdue}d overdue
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
