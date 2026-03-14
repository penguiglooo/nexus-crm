"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { ContactWithHealth } from "@/lib/types";

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#10b981",
  stale: "#f59e0b",
  neglected: "#ef4444",
  neutral: "#737373",
};

const HEALTH_LABELS: Record<string, string> = {
  healthy: "Healthy",
  stale: "Stale",
  neglected: "Neglected",
  neutral: "No Goal",
};

interface HealthDistributionProps {
  contacts: ContactWithHealth[];
}

interface SegmentData {
  name: string;
  value: number;
  key: string;
  percentage: string;
}

export function HealthDistribution({ contacts }: HealthDistributionProps) {
  const total = contacts.length;

  const segments: SegmentData[] = (["healthy", "stale", "neglected", "neutral"] as const)
    .map((key) => {
      const count = contacts.filter((c) => c.health === key).length;
      return {
        name: HEALTH_LABELS[key],
        value: count,
        key,
        percentage: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%",
      };
    })
    .filter((s) => s.value > 0);

  if (segments.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No contacts yet
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={segments}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            label={(props: PieLabelRenderProps) => {
              const payload = props.payload as SegmentData | undefined;
              return `${props.name ?? ""} ${payload?.percentage ?? ""}`;
            }}
          >
            {segments.map((entry) => (
              <Cell key={entry.key} fill={HEALTH_COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#141414",
              border: "1px solid #1e1e1e",
              borderRadius: 8,
              color: "#fafafa",
            }}
            formatter={(value, name) => [`${value} contacts`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>
    </div>
  );
}
