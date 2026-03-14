"use client";

import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/types";

const healthConfig = {
  healthy: { label: "Healthy", dotClass: "bg-emerald-500", textClass: "text-emerald-500" },
  stale: { label: "Stale", dotClass: "bg-amber-500", textClass: "text-amber-500" },
  neglected: { label: "Neglected", dotClass: "bg-red-500", textClass: "text-red-500" },
  neutral: { label: "No goal", dotClass: "bg-gray-500", textClass: "text-gray-500" },
};

export function HealthBadge({ health, showLabel = true }: { health: HealthStatus; showLabel?: boolean }) {
  const config = healthConfig[health];
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("h-2 w-2 rounded-full", config.dotClass)} />
      {showLabel && (
        <span className={cn("text-xs font-medium", config.textClass)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export function HealthDot({ health }: { health: HealthStatus }) {
  return <HealthBadge health={health} showLabel={false} />;
}
