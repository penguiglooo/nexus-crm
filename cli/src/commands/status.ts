import { Command } from 'commander';
import { supabase } from '../lib/supabase.js';
import {
  printJson,
  printSection,
  printKeyValue,
  formatDate,
  formatRelative,
  healthColor,
  categoryBadge,
  computeHealth,
  daysSince,
  todayStr,
  type Health,
} from '../lib/format.js';
import chalk from 'chalk';
import { format, addDays, parseISO } from 'date-fns';

export const statusCommand = new Command('status')
  .description('Dashboard — overdue contacts, birthdays, drafts, suggestions')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    const today = todayStr();
    const in14days = format(addDays(new Date(), 14), 'yyyy-MM-dd');

    // Fetch all data in parallel
    const [contactsRes, draftsRes, remindersRes] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, name, category, frequency_goal, birthday, last_interaction_at, tags'),
      supabase
        .from('message_drafts')
        .select('id, contact_id, occasion, draft_text, status, created_at')
        .eq('status', 'pending'),
      supabase
        .from('reminders')
        .select('id, contact_id, reminder_type, due_date, message, status')
        .eq('status', 'pending'),
    ]);

    if (contactsRes.error) {
      console.error('Error fetching contacts:', contactsRes.error.message);
      process.exit(1);
    }

    const contacts = contactsRes.data || [];
    const pendingDrafts = draftsRes.data || [];
    const pendingReminders = remindersRes.data || [];

    // Compute health for every contact
    const withHealth = contacts.map((c: any) => ({
      ...c,
      health: computeHealth(c.last_interaction_at, c.frequency_goal),
      days_since: daysSince(c.last_interaction_at),
    }));

    // Stats
    const stats = {
      total: contacts.length,
      healthy: withHealth.filter((c: any) => c.health === 'healthy').length,
      stale: withHealth.filter((c: any) => c.health === 'stale').length,
      neglected: withHealth.filter((c: any) => c.health === 'neglected').length,
    };

    // Overdue (stale + neglected)
    const overdue = withHealth
      .filter((c: any) => c.health === 'stale' || c.health === 'neglected')
      .sort((a: any, b: any) => (b.days_since ?? 999) - (a.days_since ?? 999));

    // Upcoming birthdays (next 14 days)
    const upcomingBirthdays = contacts
      .filter((c: any) => {
        if (!c.birthday) return false;
        const bday = parseISO(c.birthday);
        const thisYear = new Date().getFullYear();
        const bdayThisYear = new Date(thisYear, bday.getMonth(), bday.getDate());
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const futureLimit = addDays(now, 14);
        return bdayThisYear >= now && bdayThisYear <= futureLimit;
      })
      .map((c: any) => {
        const bday = parseISO(c.birthday);
        const thisYear = new Date().getFullYear();
        const bdayThisYear = new Date(thisYear, bday.getMonth(), bday.getDate());
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysUntil = Math.round((bdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { name: c.name, birthday: c.birthday, days_until: daysUntil };
      })
      .sort((a: any, b: any) => a.days_until - b.days_until);

    // Smart suggestions
    const suggestions: string[] = [];
    for (const c of overdue) {
      if (c.health === 'neglected' && c.days_since != null) {
        suggestions.push(`You haven't talked to ${c.name} in ${c.days_since} days`);
      }
    }
    for (const b of upcomingBirthdays) {
      if (b.days_until === 0) {
        suggestions.push(`${b.name}'s birthday is TODAY!`);
      } else if (b.days_until <= 3) {
        suggestions.push(`${b.name}'s birthday is in ${b.days_until} day${b.days_until > 1 ? 's' : ''}`);
      }
    }
    if (pendingDrafts.length > 0) {
      suggestions.push(`${pendingDrafts.length} message draft${pendingDrafts.length > 1 ? 's' : ''} pending review`);
    }
    if (pendingReminders.length > 0) {
      suggestions.push(`${pendingReminders.length} reminder${pendingReminders.length > 1 ? 's' : ''} need attention`);
    }

    // ── JSON output ──
    if (opts.json) {
      return printJson({
        stats,
        overdue: overdue.map((c: any) => ({
          name: c.name,
          category: c.category,
          health: c.health,
          days_since_contact: c.days_since,
          frequency_goal: c.frequency_goal,
        })),
        upcoming_birthdays: upcomingBirthdays,
        pending_drafts: pendingDrafts.length,
        pending_reminders: pendingReminders.length,
        suggestions,
      });
    }

    // ── Pretty output ──
    printSection('Nexus CRM Dashboard', '\u{1F4CA}');
    console.log();

    // Stats bar
    console.log(
      `  ${chalk.bold(String(stats.total))} contacts  |  ` +
      `${chalk.green(String(stats.healthy))} healthy  |  ` +
      `${chalk.yellow(String(stats.stale))} stale  |  ` +
      `${chalk.red(String(stats.neglected))} neglected`
    );

    // Overdue
    if (overdue.length > 0) {
      printSection('Overdue Contacts', '\u{26A0}\u{FE0F}');
      for (const c of overdue) {
        const days = c.days_since != null ? `${c.days_since}d ago` : 'never';
        console.log(
          `  ${healthColor(c.health as Health)} ${chalk.bold(c.name)} ` +
          `${categoryBadge(c.category)} — last contact: ${days} (goal: ${c.frequency_goal ?? '—'})`
        );
      }
    }

    // Birthdays
    if (upcomingBirthdays.length > 0) {
      printSection('Upcoming Birthdays', '\u{1F382}');
      for (const b of upcomingBirthdays) {
        const label = b.days_until === 0 ? chalk.bold.red('TODAY!') : `in ${b.days_until} day${b.days_until > 1 ? 's' : ''}`;
        console.log(`  ${chalk.bold(b.name)} — ${label} (${formatDate(b.birthday)})`);
      }
    }

    // Pending drafts
    if (pendingDrafts.length > 0) {
      printSection('Pending Drafts', '\u{1F4DD}');
      console.log(`  ${pendingDrafts.length} message draft${pendingDrafts.length > 1 ? 's' : ''} awaiting review`);
    }

    // Suggestions
    if (suggestions.length > 0) {
      printSection('Suggestions', '\u{1F4A1}');
      for (const s of suggestions) {
        console.log(`  ${chalk.dim('\u{2022}')} ${s}`);
      }
    }

    console.log();
  });
