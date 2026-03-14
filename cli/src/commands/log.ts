import { Command } from 'commander';
import { supabase } from '../lib/supabase.js';
import {
  printJson,
  printSection,
  printKeyValue,
  formatDate,
  todayStr,
} from '../lib/format.js';
import chalk from 'chalk';

// ── Auto-detect interaction type from description ────────────────────

function detectType(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('called') || lower.includes('phone') || lower.includes('rang')) return 'call';
  if (lower.includes('met') || lower.includes('lunch') || lower.includes('coffee') || lower.includes('dinner') || lower.includes('meeting') || lower.includes('padel')) return 'meeting';
  if (lower.includes('texted') || lower.includes('messaged') || lower.includes('whatsapp') || lower.includes('dm') || lower.includes('slack')) return 'message';
  if (lower.includes('emailed') || lower.includes('email') || lower.includes('mail')) return 'email';
  return 'other';
}

// ── Fuzzy contact resolution ─────────────────────────────────────────

async function resolveContact(nameQuery: string): Promise<any> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name')
    .ilike('name', `%${nameQuery}%`);

  if (error) {
    console.error('Error searching contacts:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(`No contact found matching "${nameQuery}"`);
    process.exit(1);
  }

  if (data.length > 1) {
    console.error(`Multiple contacts match "${nameQuery}":`);
    for (const c of data) {
      console.error(`  - ${c.name}`);
    }
    console.error('Please be more specific.');
    process.exit(1);
  }

  return data[0];
}

export const logCommand = new Command('log')
  .description('Log an interaction with a contact')
  .argument('<description>', 'What happened (e.g. "Called to catch up")')
  .requiredOption('--contact <name>', 'Contact name (fuzzy match)')
  .option('--type <type>', 'Interaction type: call, meeting, message, email, other')
  .option('--rating <n>', 'Quality rating 1-5', parseInt)
  .option('--date <date>', 'Date (YYYY-MM-DD, default: today)')
  .option('--json', 'Output as JSON')
  .action(async (description: string, opts) => {
    const contact = await resolveContact(opts.contact);
    const interactionType = opts.type || detectType(description);
    const date = opts.date || todayStr();

    const record: any = {
      contact_id: contact.id,
      type: interactionType,
      date,
      notes: description,
    };
    if (opts.rating) record.quality_rating = opts.rating;

    // Insert interaction and update last_interaction_at in parallel
    const [interactionRes, updateRes] = await Promise.all([
      supabase
        .from('interactions')
        .insert(record)
        .select()
        .single(),
      supabase
        .from('contacts')
        .update({ last_interaction_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', contact.id),
    ]);

    if (interactionRes.error) {
      console.error('Error logging interaction:', interactionRes.error.message);
      process.exit(1);
    }

    if (updateRes.error) {
      console.error('Warning: could not update last_interaction_at:', updateRes.error.message);
    }

    const data = interactionRes.data;

    if (opts.json) return printJson({ ...data, contact_name: contact.name });

    printSection('Interaction Logged', '\u{2705}');
    printKeyValue('Contact', chalk.bold(contact.name));
    printKeyValue('Type', chalk.cyan(data.type));
    printKeyValue('Date', formatDate(data.date));
    if (data.quality_rating) printKeyValue('Rating', '*'.repeat(data.quality_rating));
    printKeyValue('Notes', data.notes);
    printKeyValue('ID', chalk.dim(data.id));
    console.log();
  });
