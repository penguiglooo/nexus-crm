import { Command } from 'commander';
import { supabase } from '../lib/supabase.js';
import {
  printJson,
  printSection,
  printKeyValue,
  formatDate,
} from '../lib/format.js';
import chalk from 'chalk';

// ── List pending reminders ───────────────────────────────────────────

const listRemindersCmd = new Command('list')
  .description('List pending reminders')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    await listReminders(!!opts.json);
  });

const doneCmd = new Command('done')
  .description('Mark a reminder as done')
  .argument('<id>', 'Reminder ID (or prefix)')
  .option('--json', 'Output as JSON')
  .action(async (id: string, opts) => {
    // Support ID prefix matching
    const { data: matches, error: matchErr } = await supabase
      .from('reminders')
      .select('id')
      .ilike('id', `${id}%`);

    if (matchErr || !matches || matches.length === 0) {
      console.error(`No reminder found matching ID "${id}"`);
      process.exit(1);
    }

    if (matches.length > 1) {
      console.error(`Multiple reminders match "${id}". Be more specific.`);
      process.exit(1);
    }

    const fullId = matches[0].id;

    const { data, error } = await supabase
      .from('reminders')
      .update({ status: 'done' })
      .eq('id', fullId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reminder:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson(data);

    console.log(`\n\u{2705}  Reminder ${chalk.dim(fullId.slice(0, 8))} marked as done.\n`);
  });

const dismissCmd = new Command('dismiss')
  .description('Dismiss a reminder')
  .argument('<id>', 'Reminder ID (or prefix)')
  .option('--json', 'Output as JSON')
  .action(async (id: string, opts) => {
    const { data: matches, error: matchErr } = await supabase
      .from('reminders')
      .select('id')
      .ilike('id', `${id}%`);

    if (matchErr || !matches || matches.length === 0) {
      console.error(`No reminder found matching ID "${id}"`);
      process.exit(1);
    }

    if (matches.length > 1) {
      console.error(`Multiple reminders match "${id}". Be more specific.`);
      process.exit(1);
    }

    const fullId = matches[0].id;

    const { data, error } = await supabase
      .from('reminders')
      .update({ status: 'dismissed' })
      .eq('id', fullId)
      .select()
      .single();

    if (error) {
      console.error('Error dismissing reminder:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson(data);

    console.log(`\n\u{1F6AB}  Reminder ${chalk.dim(fullId.slice(0, 8))} dismissed.\n`);
  });

// ── Shared list logic ────────────────────────────────────────────────

async function listReminders(json: boolean) {
  const { data, error } = await supabase
    .from('reminders')
    .select('id, contact_id, reminder_type, due_date, message, status, contacts(name)')
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching reminders:', error.message);
    process.exit(1);
  }

  const reminders = data || [];

  if (json) {
    return printJson(reminders.map((r: any) => ({
      id: r.id,
      contact_name: r.contacts?.name,
      type: r.reminder_type,
      due_date: r.due_date,
      message: r.message,
      status: r.status,
    })));
  }

  printSection(`Pending Reminders (${reminders.length})`, '\u{23F0}');

  if (reminders.length === 0) {
    console.log('  No pending reminders.');
    console.log();
    return;
  }

  for (const r of reminders) {
    const overdue = new Date(r.due_date) < new Date() ? chalk.red(' [OVERDUE]') : '';
    console.log(
      `  ${chalk.dim(r.id.slice(0, 8))} ${chalk.bold(r.contacts?.name ?? 'Unknown')} ` +
      `${chalk.cyan(`[${r.reminder_type}]`)} due ${formatDate(r.due_date)}${overdue}`
    );
    if (r.message) console.log(`    ${chalk.gray(r.message)}`);
  }
  console.log();
}

// ── Parent command ───────────────────────────────────────────────────
// `nexus remind` (no subcommand) should list reminders

export const remindCommand = new Command('remind')
  .description('Manage reminders')
  .addCommand(listRemindersCmd)
  .addCommand(doneCmd)
  .addCommand(dismissCmd)
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    await listReminders(!!opts.json);
  });
