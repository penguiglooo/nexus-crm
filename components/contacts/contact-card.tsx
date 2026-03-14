"use client";

import Link from "next/link";
import { Phone, Mail, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HealthDot } from "@/components/shared/health-badge";
import { cn, formatRelativeTime, getCategoryColor } from "@/lib/utils";
import type { ContactWithHealth } from "@/lib/types";

interface ContactCardProps {
  contact: ContactWithHealth;
  index: number;
}

export function ContactCard({ contact, index }: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/contacts/${contact.id}`} className="block">
        <Card className="group relative overflow-hidden p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
          {/* Header: Name + Health dot */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors">
                {contact.name}
              </h3>
              <HealthDot health={contact.health} />
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[10px]", getCategoryColor(contact.category))}
            >
              {contact.category}
            </Badge>
          </div>

          {/* Contact details */}
          <div className="space-y-1.5 mb-3">
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Last contacted */}
          <div className="border-t border-border pt-2">
            <p className="text-xs text-muted-foreground">
              {contact.last_interaction_at
                ? `Last contacted ${formatRelativeTime(contact.last_interaction_at)}`
                : "Never contacted"}
            </p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
