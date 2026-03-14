"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase/client";

const TYPE_COLORS: Record<string, string> = {
  call: "#3b82f6",
  meeting: "#8b5cf6",
  message: "#06b6d4",
  email: "#f59e0b",
  other: "#737373",
};

const TYPE_LABELS: Record<string, string> = {
  call: "Call",
  meeting: "Meeting",
  message: "Message",
  email: "Email",
  other: "Other",
};

interface DayData {
  date: string;
  label: string;
  call: number;
  meeting: number;
  message: number;
  email: number;
  other: number;
}

export function InteractionChart() {
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: interactions } = await supabase
          .from("interactions")
          .select("type, date")
          .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
          .order("date");

        // Build a map of all 30 days
        const dayMap = new Map<string, DayData>();
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const label = `${d.getMonth() + 1}/${d.getDate()}`;
          dayMap.set(dateStr, {
            date: dateStr,
            label,
            call: 0,
            meeting: 0,
            message: 0,
            email: 0,
            other: 0,
          });
        }

        // Count interactions by date and type
        for (const interaction of interactions || []) {
          const day = dayMap.get(interaction.date);
          if (day && interaction.type in day) {
            (day as unknown as Record<string, number>)[interaction.type] += 1;
          }
        }

        setData(Array.from(dayMap.values()));
      } catch (err) {
        console.error("Failed to load interaction chart data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No interactions in the last 30 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#737373", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1e1e1e" }}
          interval={4}
        />
        <YAxis
          tick={{ fill: "#737373", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#141414",
            border: "1px solid #1e1e1e",
            borderRadius: 8,
            color: "#fafafa",
          }}
          labelFormatter={(label) => `Date: ${label}`}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#737373" }}
          iconType="square"
          iconSize={10}
        />
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <Bar
            key={type}
            dataKey={type}
            name={TYPE_LABELS[type]}
            fill={color}
            stackId="interactions"
            radius={type === "other" ? [2, 2, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
