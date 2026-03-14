import { Command } from 'commander';
import { supabase } from '../lib/supabase.js';
import {
  printJson,
  printSection,
  printKeyValue,
} from '../lib/format.js';
import chalk from 'chalk';

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

// ── Subcommands ──────────────────────────────────────────────────────

const addNoteCmd = new Command('add')
  .description('Add a note to a contact')
  .argument('<name>', 'Contact name (fuzzy match)')
  .argument('<content>', 'Note content')
  .option('--type <type>', 'Note type: fact, preference, personality, context', 'fact')
  .option('--json', 'Output as JSON')
  .action(async (name: string, content: string, opts) => {
    const contact = await resolveContact(name);

    const { data, error } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: contact.id,
        note_type: opts.type,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding note:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson({ ...data, contact_name: contact.name });

    printSection('Note Added', '\u{1F4CC}');
    printKeyValue('Contact', chalk.bold(contact.name));
    printKeyValue('Type', data.note_type);
    printKeyValue('Content', data.content);
    printKeyValue('ID', chalk.dim(data.id));
    console.log();
  });

const listNotesCmd = new Command('list')
  .description('List notes for a contact')
  .argument('<name>', 'Contact name (fuzzy match)')
  .option('--json', 'Output as JSON')
  .action(async (name: string, opts) => {
    const contact = await resolveContact(name);

    const { data, error } = await supabase
      .from('contact_notes')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error.message);
      process.exit(1);
    }

    const notes = data || [];

    if (opts.json) return printJson({ contact_name: contact.name, notes });

    printSection(`Notes for ${contact.name}`, '\u{1F4CC}');

    if (notes.length === 0) {
      console.log('  No notes found.');
      console.log();
      return;
    }

    // Group by type
    const grouped: Record<string, any[]> = {};
    for (const n of notes) {
      const type = n.note_type || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(n);
    }

    for (const [type, items] of Object.entries(grouped)) {
      console.log(`\n  ${chalk.bold.underline(type.toUpperCase())}`);
      for (const n of items) {
        console.log(`    ${chalk.dim('\u{2022}')} ${n.content} ${chalk.dim(`(${n.id.slice(0, 8)})`)}`);
      }
    }
    console.log();
  });

// ── Parent command ───────────────────────────────────────────────────

export const noteCommand = new Command('note')
  .description('Manage contact notes')
  .addCommand(addNoteCmd)
  .addCommand(listNotesCmd);
