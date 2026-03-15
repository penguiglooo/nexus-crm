import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | null): string {
  if (!date) return 'Never';
  const days = Math.round((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (days < 30) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  const months = Math.round(days / 30);
  if (days < 365) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.round(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

export function daysUntilBirthday(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  return Math.round((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getHealthColor(health: string): string {
  switch (health) {
    case 'healthy': return 'text-emerald-500';
    case 'stale': return 'text-amber-500';
    case 'neglected': return 'text-red-500';
    default: return 'text-muted-foreground';
  }
}

export function getHealthBgColor(health: string): string {
  switch (health) {
    case 'healthy': return 'bg-emerald-500';
    case 'stale': return 'bg-amber-500';
    case 'neglected': return 'bg-red-500';
    default: return 'bg-muted';
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    friend: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    family: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    colleague: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    investor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    mentor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return colors[category] || colors.other;
}
