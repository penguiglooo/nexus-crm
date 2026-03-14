"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import type { ContactWithHealth } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  friend: "#3b82f6",
  family: "#8b5cf6",
  colleague: "#06b6d4",
  investor: "#f59e0b",
  mentor: "#10b981",
  other: "#737373",
};

const CATEGORY_LABELS: Record<string, string> = {
  friend: "Friend",
  family: "Family",
  colleague: "Colleague",
  investor: "Investor",
  mentor: "Mentor",
  other: "Other",
};

interface CategoryBreakdownProps {
  contacts: ContactWithHealth[];
}

interface CategoryData {
  name: string;
  key: string;
  count: number;
}

export function CategoryBreakdown({ contacts }: CategoryBreakdownProps) {
  const categories: CategoryData[] = (
    ["friend", "family", "colleague", "investor", "mentor", "other"] as const
  )
    .map((key) => ({
      name: CATEGORY_LABELS[key],
      key,
      count: contacts.filter((c) => c.category === key).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  if (categories.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No contacts yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={categories}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 4, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#737373", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "#737373", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#141414",
            border: "1px solid #1e1e1e",
            borderRadius: 8,
            color: "#fafafa",
          }}
          formatter={(value) => [`${value} contacts`]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
          {categories.map((entry) => (
            <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key]} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "#a3a3a3", fontSize: 12, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
