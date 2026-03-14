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
  type Health,
} from '../lib/format.js';
import chalk from 'chalk';

// ── Fuzzy name matching ──────────────────────────────────────────────

async function resolveContact(nameQuery: string): Promise<any> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
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
      console.error(`  - ${c.name} (${c.category ?? 'uncategorized'})`);
    }
    console.error('Please be more specific.');
    process.exit(1);
  }

  return data[0];
}

// ── Subcommands ──────────────────────────────────────────────────────

const addCmd = new Command('add')
  .description('Add a new contact')
  .argument('<name>', 'Contact name')
  .option('--category <category>', 'Category: friend, family, colleague, investor, mentor, other')
  .option('--phone <phone>', 'Phone number')
  .option('--email <email>', 'Email address')
  .option('--frequency <freq>', 'Frequency goal: weekly, biweekly, monthly, quarterly, yearly')
  .option('--birthday <date>', 'Birthday (YYYY-MM-DD)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--json', 'Output as JSON')
  .action(async (name: string, opts) => {
    const record: any = { name };
    if (opts.category) record.category = opts.category;
    if (opts.phone) record.phone = opts.phone;
    if (opts.email) record.email = opts.email;
    if (opts.frequency) record.frequency_goal = opts.frequency;
    if (opts.birthday) record.birthday = opts.birthday;
    if (opts.tags) record.tags = opts.tags.split(',').map((t: string) => t.trim());

    const { data, error } = await supabase
      .from('contacts')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('Error adding contact:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson(data);

    printSection(`Contact Added`, '\u{2705}');
    printKeyValue('Name', data.name);
    printKeyValue('Category', categoryBadge(data.category));
    printKeyValue('Phone', data.phone);
    printKeyValue('Email', data.email);
    printKeyValue('Frequency', data.frequency_goal);
    printKeyValue('Birthday', formatDate(data.birthday));
    printKeyValue('Tags', data.tags?.join(', '));
    printKeyValue('ID', chalk.dim(data.id));
    console.log();
  });

const listCmd = new Command('list')
  .description('List contacts')
  .option('--health <health>', 'Filter by health: healthy, stale, neglected')
  .option('--category <category>', 'Filter by category')
  .option('--search <query>', 'Search by name')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    let query = supabase
      .from('contacts')
      .select('id, name, category, frequency_goal, last_interaction_at, phone, email, tags, birthday');

    if (opts.category) {
      query = query.eq('category', opts.category);
    }
    if (opts.search) {
      query = query.ilike('name', `%${opts.search}%`);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      console.error('Error listing contacts:', error.message);
      process.exit(1);
    }

    let contacts = (data || []).map((c: any) => ({
      ...c,
      health: computeHealth(c.last_interaction_at, c.frequency_goal),
      days_since: daysSince(c.last_interaction_at),
    }));

    // Filter by health (computed client-side)
    if (opts.health) {
      contacts = contacts.filter((c: any) => c.health === opts.health);
    }

    if (opts.json) {
      return printJson(contacts.map((c: any) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        health: c.health,
        days_since_contact: c.days_since,
        frequency_goal: c.frequency_goal,
        phone: c.phone,
        email: c.email,
        tags: c.tags,
      })));
    }

    printSection(`Contacts (${contacts.length})`, '\u{1F4CB}');
    if (contacts.length === 0) {
      console.log('  No contacts found.');
    } else {
      for (const c of contacts) {
        const days = c.days_since != null ? `${c.days_since}d ago` : 'never';
        console.log(
          `  ${healthColor(c.health as Health)} ${chalk.bold(c.name)} ` +
          `${categoryBadge(c.category)} — last: ${days}`
        );
      }
    }
    console.log();
  });

const showCmd = new Command('show')
  .description('Show contact details (fuzzy name match)')
  .argument('<name>', 'Contact name (fuzzy match)')
  .option('--json', 'Output as JSON')
  .action(async (name: string, opts) => {
    const contact = await resolveContact(name);
    const health = computeHealth(contact.last_interaction_at, contact.frequency_goal);
    const days = daysSince(contact.last_interaction_at);

    // Fetch recent interactions + notes in parallel
    const [interactionsRes, notesRes] = await Promise.all([
      supabase
        .from('interactions')
        .select('*')
        .eq('contact_id', contact.id)
        .order('date', { ascending: false })
        .limit(5),
      supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false }),
    ]);

    const interactions = interactionsRes.data || [];
    const notes = notesRes.data || [];

    if (opts.json) {
      return printJson({
        ...contact,
        health,
        days_since_contact: days,
        recent_interactions: interactions,
        notes,
      });
    }

    printSection(contact.name, '\u{1F464}');
    printKeyValue('ID', chalk.dim(contact.id));
    printKeyValue('Category', categoryBadge(contact.category));
    printKeyValue('Health', healthColor(health as Health));
    printKeyValue('Phone', contact.phone);
    printKeyValue('Email', contact.email);
    printKeyValue('Frequency', contact.frequency_goal);
    printKeyValue('Birthday', formatDate(contact.birthday));
    printKeyValue('Tags', contact.tags?.join(', '));
    printKeyValue('Last Contact', contact.last_interaction_at ? `${formatRelative(contact.last_interaction_at)} (${formatDate(contact.last_interaction_at)})` : null);
    printKeyValue('Notes', contact.notes);

    if (interactions.length > 0) {
      printSection('Recent Interactions', '\u{1F4AC}');
      for (const i of interactions) {
        const rating = i.quality_rating ? ` [${'*'.repeat(i.quality_rating)}]` : '';
        console.log(
          `  ${formatDate(i.date)} ${chalk.cyan(i.type)}${rating}` +
          (i.notes ? ` — ${i.notes}` : '')
        );
      }
    }

    if (notes.length > 0) {
      printSection('Notes', '\u{1F4CC}');
      for (const n of notes) {
        console.log(`  ${chalk.dim(`[${n.note_type}]`)} ${n.content}`);
      }
    }

    console.log();
  });

const editCmd = new Command('edit')
  .description('Edit a contact (fuzzy name match)')
  .argument('<name>', 'Contact name (fuzzy match)')
  .option('--category <category>', 'Category')
  .option('--phone <phone>', 'Phone number')
  .option('--email <email>', 'Email address')
  .option('--frequency <freq>', 'Frequency goal')
  .option('--birthday <date>', 'Birthday (YYYY-MM-DD)')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--rename <newName>', 'Rename contact')
  .option('--json', 'Output as JSON')
  .action(async (name: string, opts) => {
    const contact = await resolveContact(name);

    const updates: any = { updated_at: new Date().toISOString() };
    if (opts.category) updates.category = opts.category;
    if (opts.phone) updates.phone = opts.phone;
    if (opts.email) updates.email = opts.email;
    if (opts.frequency) updates.frequency_goal = opts.frequency;
    if (opts.birthday) updates.birthday = opts.birthday;
    if (opts.tags) updates.tags = opts.tags.split(',').map((t: string) => t.trim());
    if (opts.rename) updates.name = opts.rename;

    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contact.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson(data);

    printSection('Contact Updated', '\u{270F}\u{FE0F}');
    printKeyValue('Name', data.name);
    printKeyValue('Category', categoryBadge(data.category));
    printKeyValue('Phone', data.phone);
    printKeyValue('Email', data.email);
    printKeyValue('Frequency', data.frequency_goal);
    printKeyValue('Birthday', formatDate(data.birthday));
    printKeyValue('Tags', data.tags?.join(', '));
    console.log();
  });

const deleteCmd = new Command('delete')
  .description('Delete a contact (fuzzy name match)')
  .argument('<name>', 'Contact name (fuzzy match)')
  .option('--json', 'Output as JSON')
  .action(async (name: string, opts) => {
    const contact = await resolveContact(name);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);

    if (error) {
      console.error('Error deleting contact:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson({ deleted: true, id: contact.id, name: contact.name });

    console.log(`\n\u{2705}  Deleted contact ${chalk.bold(contact.name)} (${chalk.dim(contact.id)})\n`);
  });

// ── Parent command ───────────────────────────────────────────────────

export const contactCommand = new Command('contact')
  .description('Manage contacts')
  .addCommand(addCmd)
  .addCommand(listCmd)
  .addCommand(showCmd)
  .addCommand(editCmd)
  .addCommand(deleteCmd);
