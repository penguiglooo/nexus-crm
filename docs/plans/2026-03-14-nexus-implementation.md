# Nexus CRM Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a personal relationship CRM with web dashboard and CLI for OpenClaw agent integration.

**Architecture:** Next.js 16 app with dark-only Geist theme (same as Health Tracker v2), Supabase on master project using `relationships` schema, CLI with Commander.js for OpenClaw. No auth — single user.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts, Geist fonts, Supabase, Commander.js (CLI), Chalk (CLI formatting)

**Reference:** `/Users/dhruv/Documents/Apps/Personal/life/health-tracker-v2/` — follow same patterns for layout, sidebar, page structure, CLI architecture, Supabase client setup.

---

### Task 1: Supabase Schema SQL

**Files:**
- Create: `supabase/schema.sql`

Write the complete SQL for the `relationships` schema with 5 tables: contacts, contact_notes, interactions, reminders, message_drafts. Include indexes, permissions (anon + service_role), and seed data (5-10 sample contacts across categories).

**Commit:** `feat: add relationships schema SQL`

---

### Task 2: Next.js Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` (if needed)
- Create: `app/layout.tsx`, `app/globals.css`
- Create: `lib/supabase/client.ts`
- Create: `.env.local` (with master Supabase credentials, `relationships` schema)
- Create: `.vercelignore`, `.gitignore`, `.node-version`

Initialize Next.js 16 project with:
- Geist Sans + Geist Mono fonts (on `<html>` element, same fix as Health Tracker)
- Dark-only theme CSS vars (bg #0a0a0a, card #141414, border #1e1e1e, accent emerald)
- shadcn/ui installed and configured
- Supabase client pointing to `relationships` schema on master project

Install deps: `next react react-dom @supabase/supabase-js geist framer-motion recharts lucide-react date-fns shadcn clsx tailwind-merge class-variance-authority tw-animate-css`

**Commit:** `feat: scaffold Next.js 16 project with Geist theme`

---

### Task 3: Shared Library — Types, Constants, Queries

**Files:**
- Create: `lib/types.ts`
- Create: `lib/constants.ts`
- Create: `lib/queries.ts`
- Create: `lib/utils.ts`

**types.ts:** All TypeScript interfaces — Contact, ContactWithHealth, ContactNote, Interaction, Reminder, MessageDraft, DashboardStats.

**constants.ts:** CONTACT_CATEGORIES, FREQUENCY_GOALS, INTERACTION_TYPES, NOTE_TYPES, health thresholds per frequency goal.

**queries.ts:** All Supabase query functions:
- `getContacts()`, `getContact(id)`, `searchContacts(query)`, `createContact(data)`, `updateContact(id, data)`, `deleteContact(id)`
- `getContactNotes(contactId)`, `addContactNote(data)`
- `getInteractions(contactId)`, `logInteraction(data)`
- `getReminders(filter?)`, `updateReminder(id, status)`
- `getMessageDrafts(filter?)`, `createDraft(data)`, `updateDraft(id, status)`
- `getDashboardStats()`, `getContactsNeedingAttention(limit)`, `getUpcomingBirthdays(days)`
- `computeHealth(contact)` — pure function using constants thresholds

**Commit:** `feat: add shared library with types, constants, and queries`

---

### Task 4: CLI — All Commands

**Files:**
- Create: `cli/package.json` (name: `nexus-cli`, bin: `nexus`)
- Create: `cli/tsconfig.json`
- Create: `cli/src/index.ts`
- Create: `cli/src/lib/supabase.ts` (lazy proxy pattern from Health Tracker)
- Create: `cli/src/lib/format.ts` (chalk formatting helpers)
- Create: `cli/src/commands/status.ts`
- Create: `cli/src/commands/contact.ts`
- Create: `cli/src/commands/log.ts`
- Create: `cli/src/commands/note.ts`
- Create: `cli/src/commands/draft.ts`
- Create: `cli/src/commands/remind.ts`
- Create: `cli/.env`

6 commands, all with `--json` flag:

**status** — Primary agent command. Returns overdue contacts, upcoming birthdays (14 days), pending drafts, summary stats, smart suggestions.

**contact** — Subcommands: `add <name>`, `list`, `search <query>`, `show <name>`, `edit <name>`, `delete <name>`. Fuzzy name matching on all name args.

**log** — `nexus log <description> --contact <name>`. Auto-detect type from keywords. `--type`, `--rating`, `--date` overrides. Updates `last_interaction_at` on contact.

**note** — `nexus note add <name> <content> --type fact|preference|personality|context`. `nexus note list <name>`.

**draft** — `nexus draft <occasion> --contact <name>`. Creates message_draft record. Occasions: birthday, checkin, followup, custom.

**remind** — `nexus remind` lists pending. `nexus remind done <id>`, `nexus remind dismiss <id>`.

**Commit:** `feat: add CLI with 6 commands for OpenClaw agent`

---

### Task 5: Layout — Sidebar + Page Wrapper

**Files:**
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/page-wrapper.tsx`

Same pattern as Health Tracker:
- Fixed 260px sidebar with "NEXUS" logo in emerald
- Nav items: Dashboard, Contacts, Reminders, Analytics (4 items, fewer than Health Tracker)
- Active state with emerald bg tint + animated left border (framer-motion layoutId)
- Contact count badge at bottom (like health score badge)
- Mobile: Sheet overlay with hamburger

**Commit:** `feat: add sidebar layout with navigation`

---

### Task 6: Dashboard Page

**Files:**
- Create: `app/page.tsx`
- Create: `components/dashboard/stat-cards.tsx`
- Create: `components/dashboard/needs-attention.tsx`
- Create: `components/dashboard/upcoming-birthdays.tsx`
- Create: `components/dashboard/recent-interactions.tsx`
- Create: `components/dashboard/pending-drafts.tsx`
- Create: `components/shared/health-badge.tsx`

4 stat cards (Total, Healthy green, Stale yellow, Neglected red).
Needs Attention list — top 5 overdue with days count and quick-log button.
Upcoming Birthdays — next 30 days with countdown.
Recent Interactions — last 10 with type icon and contact name.
Pending Drafts — message drafts with approve/dismiss actions.

**Commit:** `feat: add dashboard page with stats and widgets`

---

### Task 7: Contacts List Page

**Files:**
- Create: `app/contacts/page.tsx`
- Create: `components/contacts/contact-card.tsx`
- Create: `components/contacts/contact-filters.tsx`
- Create: `components/contacts/add-contact-dialog.tsx`

Search bar with real-time filtering.
Category filter tabs: All, Family, Friends, Colleagues, Investors, Mentors.
Health filter pills: All, Healthy, Stale, Neglected.
Responsive card grid (1-3 columns).
Each card: name, category badge, health dot, last contacted ago, tags, phone/email icons.
Add Contact dialog — form with name, category, frequency, phone, email, birthday, tags, notes.

**Commit:** `feat: add contacts list page with search and filters`

---

### Task 8: Contact Detail Page

**Files:**
- Create: `app/contacts/[id]/page.tsx`
- Create: `components/contacts/contact-header.tsx`
- Create: `components/contacts/contact-notes-section.tsx`
- Create: `components/contacts/interaction-timeline.tsx`
- Create: `components/contacts/log-interaction-dialog.tsx`
- Create: `components/contacts/add-note-dialog.tsx`
- Create: `components/contacts/edit-contact-dialog.tsx`

Header: name, category badge, health indicator, contact info (phone/email), frequency goal.
Quick actions row: Log Interaction, Add Note, Edit, Delete.
AI Notes section: grouped by type (fact/preference/personality/context), add new note dialog.
Interaction Timeline: chronological with type icon, date, quality stars, duration, notes.
Log Interaction dialog: type selector (5 icons), date picker, rating stars, duration, notes.

**Commit:** `feat: add contact detail page with timeline and notes`

---

### Task 9: Reminders Page

**Files:**
- Create: `app/reminders/page.tsx`
- Create: `components/reminders/reminder-card.tsx`
- Create: `components/reminders/draft-card.tsx`

Tabs: All, Birthdays, Check-ins, Overdue.
Reminder cards: contact name, reason, due date, urgency color.
Draft cards: contact name, occasion, draft text, approve/edit/dismiss buttons.
Empty state for each tab.

**Commit:** `feat: add reminders page with draft management`

---

### Task 10: Analytics Page

**Files:**
- Create: `app/analytics/page.tsx`
- Create: `components/analytics/interaction-chart.tsx`
- Create: `components/analytics/health-distribution.tsx`
- Create: `components/analytics/category-breakdown.tsx`

Interaction frequency bar chart (last 30 days, by type).
Health distribution donut chart (healthy/stale/neglected).
Category breakdown horizontal bars.
"Most contacted" and "Most neglected" top-5 lists.

**Commit:** `feat: add analytics page with charts`

---

### Task 11: Finalization — Schema Deploy, Vercel, CLI Tools

**Files:**
- Modify: `/Users/dhruv/Documents/Apps/cli-tools/setup.sh` (add nexus entry)
- Create: `.claude/launch.json` (dev server config)

Steps:
1. Deploy `relationships` schema to master Supabase (same process as Health Tracker — migration + config push to expose schema)
2. Create GitHub repo (`penguiglooo/nexus-crm`)
3. Deploy to Vercel with env vars
4. Set alias: `dhruvs-nexus.vercel.app`
5. Update cli-tools/setup.sh: add `"nexus|nexus-crm|cli|main"`
6. Verify web app loads with live data
7. Verify CLI connects and `nexus status --json` works

**Commit:** `feat: deployment config and finalization`

---

## Execution Notes

- Tasks 1-3 are foundational, must be done first
- Task 4 (CLI) can be done in parallel with Tasks 5-10 (web UI)
- Task 11 depends on everything else being complete
- Total: ~11 tasks, similar scope to Health Tracker v2
