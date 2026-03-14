# Nexus — Personal Relationship Intelligence

## Overview

A personal CRM that tracks relationships, scores their health, and powers an AI agent (via OpenClaw) to nudge you about check-ins, draft messages, and remember personal details about each contact.

**Primary interface:** CLI for OpenClaw agent (Telegram → Claude Code → CLI)
**Secondary interface:** Web dashboard for occasional browsing

## Architecture

- **Framework:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui, Geist fonts, dark-only theme (#0a0a0a)
- **Animations:** Framer Motion
- **Database:** Supabase on master project (`ixuhdnsfthxzxnbuuijm`), `relationships` schema
- **Auth:** None (single-user personal app)
- **Deploy:** Vercel
- **CLI:** TypeScript + Commander.js, `nexus` command, installed via cli-tools/setup.sh

## Database Schema (5 tables)

### contacts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text NOT NULL | |
| phone | text | |
| email | text | |
| category | text CHECK | friend, family, colleague, investor, mentor, other |
| frequency_goal | text CHECK | weekly, biweekly, monthly, quarterly, yearly |
| birthday | date | |
| tags | text[] | e.g. ['dubai', 'tech', 'close-friend'] |
| notes | text | General free-text notes |
| last_interaction_at | timestamptz | Updated on each interaction log |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### contact_notes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contact_id | uuid FK → contacts | |
| note_type | text CHECK | fact, preference, personality, context |
| content | text NOT NULL | e.g. "allergic to dogs", "prefers serious tone" |
| created_at | timestamptz | |

### interactions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contact_id | uuid FK → contacts | |
| type | text CHECK | call, meeting, message, email, other |
| date | date NOT NULL | |
| quality_rating | integer CHECK 1-5 | |
| duration_min | integer | |
| notes | text | What was discussed |
| created_at | timestamptz | |

### reminders
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contact_id | uuid FK → contacts | |
| reminder_type | text CHECK | frequency, birthday, custom |
| due_date | date NOT NULL | |
| message | text | Agent-readable reason |
| status | text CHECK | pending, dismissed, done |
| created_at | timestamptz | |

### message_drafts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contact_id | uuid FK → contacts | |
| occasion | text CHECK | birthday, checkin, followup, custom |
| draft_text | text NOT NULL | The actual message text |
| bulk_action_id | uuid FK → bulk_actions | NULL for individual drafts |
| status | text CHECK | pending, approved, sent, dismissed |
| created_at | timestamptz | |

### bulk_actions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| action_type | text CHECK | message, birthday_wish, new_year, custom |
| filter_category | text | Which category was targeted (or 'all') |
| template | text NOT NULL | The base message template |
| total_contacts | integer | How many contacts matched |
| drafts_created | integer | How many drafts were generated |
| drafts_approved | integer | How many approved/sent |
| status | text CHECK | drafting, pending_approval, completed, cancelled |
| created_at | timestamptz | |

This links to message_drafts via a `bulk_action_id` column on message_drafts.

## Health Scoring

Computed from `frequency_goal` vs days since `last_interaction_at`:

| Frequency Goal | Healthy | Stale | Neglected |
|----------------|---------|-------|-----------|
| weekly | ≤10 days | 11-21 days | >21 days |
| biweekly | ≤21 days | 22-42 days | >42 days |
| monthly | ≤45 days | 46-90 days | >90 days |
| quarterly | ≤120 days | 121-240 days | >240 days |
| yearly | ≤400 days | 401-600 days | >600 days |

Contacts with no `last_interaction_at` = neglected.
Contacts with no `frequency_goal` = no health scoring (neutral).

## Web UI (5 pages + sidebar)

### Sidebar
Same pattern as Health Tracker: fixed left sidebar, "NEXUS" logo, emerald accent, nav items with icons.

### 1. Dashboard (`/`)
- 4 stat cards: Total Contacts, Healthy (green), Stale (yellow), Neglected (red)
- "Needs Attention" list — top 5 most overdue contacts with days overdue
- "Upcoming Birthdays" — next 30 days
- "Recent Interactions" — last 10 logged interactions
- "Pending Drafts" — message drafts awaiting approval

### 2. Contacts (`/contacts`)
- Search bar + category filter tabs (All, Family, Friends, Colleagues, Investors, etc.)
- Contact cards in a responsive grid:
  - Name, category badge, health indicator (colored dot)
  - Phone/email icons
  - Tags as small badges
  - "Last contacted X days ago"
- Click card → Contact Detail page

### 3. Contact Detail (`/contacts/[id]`)
- Header: name, category, health badge, contact info
- Quick actions: Log Interaction, Add Note, Edit, Delete
- AI Notes section: typed notes (fact/preference/personality/context) with add button
- Interaction Timeline: chronological list with type icon, date, quality stars, notes
- Reminders section: pending reminders for this contact

### 4. Reminders (`/reminders`)
- List of pending reminders grouped by urgency
- Each shows: contact name, reason, due date, suggested action
- Message drafts with approve/edit/dismiss buttons
- Filter: All, Birthday, Check-in, Overdue

### 5. Analytics (`/analytics`)
- Interaction frequency chart (last 30 days)
- Health distribution pie/donut chart
- Category breakdown bar chart
- "Most contacted" and "Most neglected" lists

## CLI Commands (for OpenClaw agent)

All commands support `--json` flag for structured agent output.

### `nexus status`
Primary agent command. Returns:
- Overdue contacts (name, days overdue, frequency goal)
- Upcoming birthdays (next 14 days)
- Pending message drafts
- Summary stats
- Smart suggestions ("You haven't talked to Mom in 45 days")

### `nexus contact add <name> [options]`
- `--category`, `--phone`, `--email`, `--frequency`, `--birthday`, `--tags`

### `nexus contact list [options]`
- `--health neglected|stale|healthy`
- `--category friend|family|...`
- `--search <query>`

### `nexus log <description> --contact <name>`
- Fuzzy name matching (like health tracker habits)
- Auto-detect interaction type from description
- `--type`, `--rating`, `--date` overrides

### `nexus note add <name> <content> [--type fact|preference|personality|context]`
- Adds an AI-readable note to a contact

### `nexus draft <occasion> --contact <name>`
- Creates a message draft for the agent to present to user
- Occasions: birthday, checkin, followup, custom

### `nexus remind`
- Lists pending reminders with message drafts
- `--mark-done <id>`, `--dismiss <id>`

### `nexus bulk <message> [options]`
- `--category family|friend|investor|...` — filter contacts
- `--health healthy|stale|neglected` — filter by health
- `--occasion birthday_wish|new_year|custom`
- Creates a bulk_action record + personalized message_drafts for each matching contact
- Drafts are personalized using each contact's contact_notes (tone, preferences, facts)
- Returns all drafts for agent to present to user for approval
- `nexus bulk approve <bulk_action_id>` — approve all drafts
- `nexus bulk approve <draft_id>` — approve individual draft
- `nexus bulk cancel <bulk_action_id>` — cancel entire batch

## Design Decisions

1. **No auth** — single user, service role key for CLI, anon key for web
2. **contact_notes separate table** — structured AI-readable notes, not free text blobs
3. **message_drafts table** — agent creates drafts, user approves via CLI or web
4. **Fuzzy contact matching** — CLI matches partial names like health tracker does with habits
5. **Same visual language** as Health Tracker — dark theme, emerald accent, Geist, framer-motion
6. **`relationships` schema** on master Supabase — isolated from other apps
