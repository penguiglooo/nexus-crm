#!/usr/bin/env node
import { Command } from 'commander';
import { statusCommand } from './commands/status.js';
import { contactCommand } from './commands/contact.js';
import { logCommand } from './commands/log.js';
import { noteCommand } from './commands/note.js';
import { draftCommand } from './commands/draft.js';
import { remindCommand } from './commands/remind.js';
import { bulkCommand } from './commands/bulk.js';

const program = new Command();
program
  .name('nexus')
  .description('Nexus CRM - Personal Relationship Intelligence')
  .version('1.0.0');

program.addCommand(statusCommand);
program.addCommand(contactCommand);
program.addCommand(logCommand);
program.addCommand(noteCommand);
program.addCommand(draftCommand);
program.addCommand(remindCommand);
program.addCommand(bulkCommand);

program.parseAsync(process.argv);
