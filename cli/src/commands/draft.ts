import { Command } from 'commander';
import { supabase } from '../lib/supabase.js';
import { resolveContact } from '../lib/resolve-contact.js';
import {
  printJson,
  printSection,
  printKeyValue,
} from '../lib/format.js';
import chalk from 'chalk';

// ── Default draft text by occasion ───────────────────────────────────

function defaultDraftText(occasion: string, contactName: string): string {
  switch (occasion) {
    case 'birthday':
      return `Happy birthday, ${contactName}! Hope you have an amazing day!`;
    case 'checkin':
      return `Hey ${contactName}, just checking in! How have you been?`;
    case 'followup':
      return `Hi ${contactName}, following up from our last conversation. Would love to continue the discussion!`;
    default:
      return `Message for ${contactName}`;
  }
}

export const draftCommand = new Command('draft')
  .description('Create a message draft for a contact')
  .argument('<occasion>', 'Occasion: birthday, checkin, followup, custom')
  .requiredOption('--contact <name>', 'Contact name (fuzzy match)')
  .option('--message <text>', 'Custom message text')
  .option('--json', 'Output as JSON')
  .action(async (occasion: string, opts) => {
    const contact = await resolveContact(opts.contact);
    const draftText = opts.message || defaultDraftText(occasion, contact.name);

    const { data, error } = await supabase
      .from('message_drafts')
      .insert({
        contact_id: contact.id,
        occasion,
        draft_text: draftText,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating draft:', error.message);
      process.exit(1);
    }

    if (opts.json) return printJson({ ...data, contact_name: contact.name });

    printSection('Draft Created', '\u{1F4DD}');
    printKeyValue('Contact', chalk.bold(contact.name));
    printKeyValue('Occasion', data.occasion);
    printKeyValue('Message', data.draft_text);
    printKeyValue('Status', data.status);
    printKeyValue('ID', chalk.dim(data.id));
    console.log();
  });
