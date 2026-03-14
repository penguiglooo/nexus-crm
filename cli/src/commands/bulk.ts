import { Command } from 'commander';
import { supabase } from '../lib/supabase.js';
import {
  printJson,
  printSection,
  printKeyValue,
  computeHealth,
  categoryBadge,
} from '../lib/format.js';
import chalk from 'chalk';

// ── Main bulk command: create drafts for multiple contacts ───────────

const bulkCreateCmd = new Command('create')
  .description('Create bulk message drafts for a group of contacts')
  .argument('<message>', 'Message template (use {name} for contact name)')
  .option('--category <category>', 'Filter by category: friend, family, colleague, investor, mentor, other')
  .option('--health <health>', 'Filter by health: healthy, stale, neglected')
  .option('--occasion <occasion>', 'Occasion: birthday_wish, new_year, custom', 'custom')
  .option('--json', 'Output as JSON')
  .action(async (message: string, opts) => {
    // Fetch contacts with optional category filter
    let query = supabase
      .from('contacts')
      .select('id, name, category, frequency_goal, last_interaction_at');

    if (opts.category) {
      query = query.eq('category', opts.category);
    }

    const { data: contacts, error: contactErr } = await query;

    if (contactErr) {
      console.error('Error fetching contacts:', contactErr.message);
      process.exit(1);
    }

    let filtered = (contacts || []).map((c: any) => ({
      ...c,
      health: computeHealth(c.last_interaction_at, c.frequency_goal),
    }));

    // Filter by health (computed client-side)
    if (opts.health) {
      filtered = filtered.filter((c: any) => c.health === opts.health);
    }

    if (filtered.length === 0) {
      console.error('No contacts match the given filters.');
      process.exit(1);
    }

    // Map occasion for the draft table
    const occasionMap: Record<string, string> = {
      birthday_wish: 'birthday',
      new_year: 'custom',
      custom: 'custom',
    };
    const draftOccasion = occasionMap[opts.occasion] || 'custom';

    // Create bulk_action record
    const { data: bulkAction, error: bulkErr } = await supabase
      .from('bulk_actions')
      .insert({
        action_type: opts.occasion === 'birthday_wish' ? 'birthday_wish' : opts.occasion === 'new_year' ? 'new_year' : 'custom',
        filter_category: opts.category || null,
        template: message,
        total_contacts: filtered.length,
        drafts_created: filtered.length,
        drafts_approved: 0,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (bulkErr) {
      console.error('Error creating bulk action:', bulkErr.message);
      process.exit(1);
    }

    // Create personalized drafts for each contact
    const drafts = filtered.map((c: any) => ({
      contact_id: c.id,
      occasion: draftOccasion,
      draft_text: message.replace(/\{name\}/gi, c.name),
      bulk_action_id: bulkAction.id,
      status: 'pending',
    }));

    const { data: createdDrafts, error: draftErr } = await supabase
      .from('message_drafts')
      .insert(drafts)
      .select();

    if (draftErr) {
      console.error('Error creating drafts:', draftErr.message);
      process.exit(1);
    }

    // Combine draft data with contact names
    const draftResults = (createdDrafts || []).map((d: any) => {
      const contact = filtered.find((c: any) => c.id === d.contact_id);
      return { ...d, contact_name: contact?.name };
    });

    if (opts.json) {
      return printJson({
        bulk_action_id: bulkAction.id,
        total_drafts: draftResults.length,
        drafts: draftResults.map((d: any) => ({
          id: d.id,
          contact_name: d.contact_name,
          message: d.draft_text,
          status: d.status,
        })),
      });
    }

    printSection(`Bulk Drafts Created`, '\u{1F4E8}');
    printKeyValue('Bulk Action ID', chalk.dim(bulkAction.id));
    printKeyValue('Total Drafts', String(draftResults.length));
    printKeyValue('Status', 'pending_approval');
    console.log();

    for (const d of draftResults) {
      console.log(`  ${chalk.bold(d.contact_name)} — ${d.draft_text}`);
    }

    console.log(`\n  Use ${chalk.cyan(`nexus bulk approve ${bulkAction.id.slice(0, 8)}`)} to approve all.`);
    console.log(`  Use ${chalk.cyan(`nexus bulk cancel ${bulkAction.id.slice(0, 8)}`)} to cancel.\n`);
  });

// ── Approve all drafts in a bulk action ──────────────────────────────

const approveCmd = new Command('approve')
  .description('Approve all drafts in a bulk action')
  .argument('<id>', 'Bulk action ID (or prefix)')
  .option('--json', 'Output as JSON')
  .action(async (id: string, opts) => {
    // Find bulk action by prefix
    const { data: matches, error: matchErr } = await supabase
      .from('bulk_actions')
      .select('id')
      .ilike('id', `${id}%`);

    if (matchErr || !matches || matches.length === 0) {
      console.error(`No bulk action found matching ID "${id}"`);
      process.exit(1);
    }

    if (matches.length > 1) {
      console.error(`Multiple bulk actions match "${id}". Be more specific.`);
      process.exit(1);
    }

    const fullId = matches[0].id;

    // Update all drafts for this bulk action to approved
    const { data: drafts, error: draftErr } = await supabase
      .from('message_drafts')
      .update({ status: 'approved' })
      .eq('bulk_action_id', fullId)
      .eq('status', 'pending')
      .select();

    if (draftErr) {
      console.error('Error approving drafts:', draftErr.message);
      process.exit(1);
    }

    const count = drafts?.length || 0;

    // Update bulk action status
    await supabase
      .from('bulk_actions')
      .update({ status: 'completed', drafts_approved: count })
      .eq('id', fullId);

    if (opts.json) {
      return printJson({ bulk_action_id: fullId, drafts_approved: count, status: 'completed' });
    }

    console.log(`\n\u{2705}  Approved ${chalk.bold(String(count))} drafts in bulk action ${chalk.dim(fullId.slice(0, 8))}.\n`);
  });

// ── Cancel a bulk action ─────────────────────────────────────────────

const cancelCmd = new Command('cancel')
  .description('Cancel a bulk action and dismiss all its drafts')
  .argument('<id>', 'Bulk action ID (or prefix)')
  .option('--json', 'Output as JSON')
  .action(async (id: string, opts) => {
    const { data: matches, error: matchErr } = await supabase
      .from('bulk_actions')
      .select('id')
      .ilike('id', `${id}%`);

    if (matchErr || !matches || matches.length === 0) {
      console.error(`No bulk action found matching ID "${id}"`);
      process.exit(1);
    }

    if (matches.length > 1) {
      console.error(`Multiple bulk actions match "${id}". Be more specific.`);
      process.exit(1);
    }

    const fullId = matches[0].id;

    // Dismiss all pending drafts
    const { data: drafts, error: draftErr } = await supabase
      .from('message_drafts')
      .update({ status: 'dismissed' })
      .eq('bulk_action_id', fullId)
      .eq('status', 'pending')
      .select();

    if (draftErr) {
      console.error('Error dismissing drafts:', draftErr.message);
      process.exit(1);
    }

    const count = drafts?.length || 0;

    // Update bulk action status
    await supabase
      .from('bulk_actions')
      .update({ status: 'cancelled' })
      .eq('id', fullId);

    if (opts.json) {
      return printJson({ bulk_action_id: fullId, drafts_dismissed: count, status: 'cancelled' });
    }

    console.log(`\n\u{1F6AB}  Cancelled bulk action ${chalk.dim(fullId.slice(0, 8))}. ${count} draft${count !== 1 ? 's' : ''} dismissed.\n`);
  });

// ── Parent command ───────────────────────────────────────────────────

export const bulkCommand = new Command('bulk')
  .description('Bulk message operations')
  .addCommand(bulkCreateCmd)
  .addCommand(approveCmd)
  .addCommand(cancelCmd);
