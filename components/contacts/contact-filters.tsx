"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CONTACT_CATEGORIES } from "@/lib/constants";
import type { HealthStatus } from "@/lib/types";

interface ContactFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedHealth: HealthStatus | null;
  onHealthChange: (health: HealthStatus | null) => void;
}

const healthFilters: { value: HealthStatus | null; label: string; dotClass: string }[] = [
  { value: null, label: "All", dotClass: "bg-gray-400" },
  { value: "healthy", label: "Healthy", dotClass: "bg-emerald-500" },
  { value: "stale", label: "Stale", dotClass: "bg-amber-500" },
  { value: "neglected", label: "Neglected", dotClass: "bg-red-500" },
];

export function ContactFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedHealth,
  onHealthChange,
}: ContactFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          All
        </button>
        {CONTACT_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() =>
              onCategoryChange(selectedCategory === cat.value ? null : cat.value)
            }
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selectedCategory === cat.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Health filter pills */}
      <div className="flex gap-2">
        {healthFilters.map((filter) => (
          <button
            key={filter.label}
            onClick={() => onHealthChange(filter.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              selectedHealth === filter.value
                ? "bg-muted text-foreground ring-1 ring-ring"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <div className={cn("h-2 w-2 rounded-full", filter.dotClass)} />
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}
