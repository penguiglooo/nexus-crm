"use client";

import { motion } from "framer-motion";
import { Users, Heart, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardStats } from "@/lib/types";

const cards = [
  { key: "total", label: "Total Contacts", icon: Users, color: "text-foreground", bg: "bg-foreground/5" },
  { key: "healthy", label: "Healthy", icon: Heart, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { key: "stale", label: "Stale", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { key: "neglected", label: "Neglected", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
] as const;

export function StatCards({ stats }: { stats: DashboardStats }) {
  const values = [stats.total_contacts, stats.healthy_count, stats.stale_count, stats.neglected_count];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.bg)}>
                  <Icon className={cn("h-5 w-5", card.color)} />
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold">{values[i]}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
