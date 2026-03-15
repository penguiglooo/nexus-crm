import chalk from 'chalk';
import { format, differenceInDays, differenceInWeeks, differenceInMonths, parseISO } from 'date-fns';

// ── JSON output ──────────────────────────────────────────────────────

export function printJson(data: any): void {
  console.log(JSON.stringify(data, null, 2));
}

// ── Section / Key-Value ──────────────────────────────────────────────

export function printSection(title: string, emoji: string): void {
  console.log(`\n${emoji}  ${chalk.bold.underline(title)}`);
}

export function printKeyValue(key: string, value: any): void {
  console.log(`  ${chalk.gray(key + ':')} ${value ?? chalk.dim('—')}`);
}

// ── Date helpers ─────────────────────────────────────────────────────

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return format(d, 'yyyy-MM-dd');
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    const now = new Date();
    const days = differenceInDays(now, date);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    const weeks = differenceInWeeks(now, date);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

    const months = differenceInMonths(now, date);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } catch {
    return dateStr;
  }
}

// ── Health / Category colors ─────────────────────────────────────────

export type Health = 'healthy' | 'stale' | 'neglected' | 'neutral';

export function healthColor(health: Health): string {
  switch (health) {
    case 'healthy':
      return chalk.green(health);
    case 'stale':
      return chalk.yellow(health);
    case 'neglected':
      return chalk.red(health);
    case 'neutral':
      return chalk.gray(health);
    default:
      return chalk.gray(health);
  }
}

export function categoryBadge(category: string | null | undefined): string {
  if (!category) return chalk.gray('uncategorized');
  switch (category) {
    case 'family':
      return chalk.magenta(category);
    case 'friend':
      return chalk.cyan(category);
    case 'colleague':
      return chalk.blue(category);
    case 'investor':
      return chalk.yellow(category);
    case 'mentor':
      return chalk.green(category);
    default:
      return chalk.white(category);
  }
}

// ── Contact health computation ───────────────────────────────────────

// Must match HEALTH_THRESHOLDS in lib/constants.ts
// Format: [healthyDays, staleDays] — beyond staleDays = neglected
const HEALTH_THRESHOLDS: Record<string, [number, number]> = {
  weekly: [10, 21],
  biweekly: [21, 42],
  monthly: [45, 90],
  quarterly: [120, 240],
  yearly: [400, 600],
};

export function computeHealth(
  lastInteractionAt: string | null | undefined,
  frequencyGoal: string | null | undefined,
): Health {
  if (!frequencyGoal) return 'neutral';
  if (!lastInteractionAt) return 'neglected';

  const thresholds = HEALTH_THRESHOLDS[frequencyGoal];
  if (!thresholds) return 'neutral';

  const [healthyDays, staleDays] = thresholds;
  const days = differenceInDays(new Date(), parseISO(lastInteractionAt));

  if (days <= healthyDays) return 'healthy';
  if (days <= staleDays) return 'stale';
  return 'neglected';
}

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    return differenceInDays(new Date(), parseISO(dateStr));
  } catch {
    return null;
  }
}
