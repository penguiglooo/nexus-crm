-- ============================================================================
-- Nexus CRM — relationships schema
-- Supabase master project: ixuhdnsfthxzxnbuuijm
-- ============================================================================

-- Create schema
CREATE SCHEMA IF NOT EXISTS relationships;

-- ============================================================================
-- TABLES
-- ============================================================================

-- contacts
CREATE TABLE relationships.contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text,
    email text,
    category text CHECK (category IN ('friend', 'family', 'colleague', 'investor', 'mentor', 'other')),
    frequency_goal text CHECK (frequency_goal IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    birthday date,
    tags text[] DEFAULT '{}',
    notes text,
    last_interaction_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- contact_notes
CREATE TABLE relationships.contact_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id uuid NOT NULL REFERENCES relationships.contacts(id) ON DELETE CASCADE,
    note_type text CHECK (note_type IN ('fact', 'preference', 'personality', 'context')),
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- interactions
CREATE TABLE relationships.interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id uuid NOT NULL REFERENCES relationships.contacts(id) ON DELETE CASCADE,
    type text CHECK (type IN ('call', 'meeting', 'message', 'email', 'other')),
    date date NOT NULL,
    quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
    duration_min integer,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- reminders
CREATE TABLE relationships.reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id uuid NOT NULL REFERENCES relationships.contacts(id) ON DELETE CASCADE,
    reminder_type text CHECK (reminder_type IN ('frequency', 'birthday', 'custom')),
    due_date date NOT NULL,
    message text,
    status text CHECK (status IN ('pending', 'dismissed', 'done')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- bulk_actions
CREATE TABLE relationships.bulk_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type text CHECK (action_type IN ('message', 'birthday_wish', 'new_year', 'custom')),
    filter_category text,
    template text NOT NULL,
    total_contacts integer,
    drafts_created integer,
    drafts_approved integer,
    status text CHECK (status IN ('drafting', 'pending_approval', 'completed', 'cancelled')) DEFAULT 'drafting',
    created_at timestamptz DEFAULT now()
);

-- message_drafts
CREATE TABLE relationships.message_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id uuid NOT NULL REFERENCES relationships.contacts(id) ON DELETE CASCADE,
    occasion text CHECK (occasion IN ('birthday', 'checkin', 'followup', 'custom')),
    draft_text text NOT NULL,
    bulk_action_id uuid REFERENCES relationships.bulk_actions(id),
    status text CHECK (status IN ('pending', 'approved', 'sent', 'dismissed')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- contacts
CREATE INDEX idx_contacts_name ON relationships.contacts(name);
CREATE INDEX idx_contacts_category ON relationships.contacts(category);
CREATE INDEX idx_contacts_last_interaction_at ON relationships.contacts(last_interaction_at);
CREATE INDEX idx_contacts_birthday ON relationships.contacts(birthday);

-- contact_notes
CREATE INDEX idx_contact_notes_contact_id ON relationships.contact_notes(contact_id);
CREATE INDEX idx_contact_notes_note_type ON relationships.contact_notes(note_type);

-- interactions
CREATE INDEX idx_interactions_contact_id ON relationships.interactions(contact_id);
CREATE INDEX idx_interactions_date ON relationships.interactions(date);
CREATE INDEX idx_interactions_type ON relationships.interactions(type);

-- reminders
CREATE INDEX idx_reminders_contact_id ON relationships.reminders(contact_id);
CREATE INDEX idx_reminders_due_date ON relationships.reminders(due_date);
CREATE INDEX idx_reminders_status ON relationships.reminders(status);
CREATE INDEX idx_reminders_reminder_type ON relationships.reminders(reminder_type);

-- bulk_actions
CREATE INDEX idx_bulk_actions_status ON relationships.bulk_actions(status);
CREATE INDEX idx_bulk_actions_action_type ON relationships.bulk_actions(action_type);

-- message_drafts
CREATE INDEX idx_message_drafts_contact_id ON relationships.message_drafts(contact_id);
CREATE INDEX idx_message_drafts_bulk_action_id ON relationships.message_drafts(bulk_action_id);
CREATE INDEX idx_message_drafts_status ON relationships.message_drafts(status);
CREATE INDEX idx_message_drafts_occasion ON relationships.message_drafts(occasion);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA relationships TO anon, service_role;

-- anon: full CRUD (single-user personal app, no auth needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA relationships TO anon;

-- service_role: full CRUD on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA relationships TO service_role;

-- Ensure future tables in this schema inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA relationships GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA relationships GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Contacts (10 sample contacts across categories)
INSERT INTO relationships.contacts (id, name, phone, email, category, frequency_goal, birthday, tags, notes, last_interaction_at) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Mom', '+971-50-123-4567', NULL, 'family', 'weekly', '1968-06-15', ARRAY['family', 'dubai'], 'Always check in on weekends. Prefers phone calls over text.', now() - interval '3 days'),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'Dad', '+971-50-234-5678', NULL, 'family', 'weekly', '1965-11-22', ARRAY['family', 'dubai'], 'Loves talking about business and cricket.', now() - interval '5 days'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'Arjun Mehta', '+971-55-345-6789', 'arjun@techstartup.io', 'friend', 'biweekly', '1997-03-08', ARRAY['dubai', 'tech', 'close-friend'], 'Co-founder of TechStartup. Met at university. Into Web3 and AI.', now() - interval '12 days'),
    ('a1b2c3d4-0004-4000-8000-000000000004', 'Sarah Chen', '+1-415-456-7890', 'sarah.chen@gmail.com', 'friend', 'monthly', '1996-09-14', ARRAY['sf', 'tech', 'close-friend'], 'Lives in SF. Works at Stripe. We catch up over FaceTime.', now() - interval '35 days'),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'Ravi Kapoor', '+91-98765-43210', 'ravi.k@venturefund.com', 'investor', 'quarterly', '1975-01-30', ARRAY['mumbai', 'investor', 'series-a'], 'Managing Partner at VentureFund. Invested in our seed round.', now() - interval '60 days'),
    ('a1b2c3d4-0006-4000-8000-000000000006', 'Emily Rodriguez', '+1-212-567-8901', 'emily.r@consulting.co', 'colleague', 'monthly', '1994-12-03', ARRAY['nyc', 'design', 'ex-colleague'], 'Former colleague at DesignCo. Great product design thinker.', now() - interval '45 days'),
    ('a1b2c3d4-0007-4000-8000-000000000007', 'James Okonkwo', '+44-20-7890-1234', 'james@okonkwo.dev', 'mentor', 'monthly', '1982-07-19', ARRAY['london', 'tech', 'mentor'], 'CTO at ScaleUp. Has been mentoring me on engineering leadership.', now() - interval '28 days'),
    ('a1b2c3d4-0008-4000-8000-000000000008', 'Fatima Al-Hassan', '+971-56-678-9012', 'fatima@creativelab.ae', 'colleague', 'biweekly', '1995-04-25', ARRAY['dubai', 'creative', 'current-project'], 'Creative director. Collaborating on the branding project.', now() - interval '8 days'),
    ('a1b2c3d4-0009-4000-8000-000000000009', 'Priya Sharma', '+91-99887-76655', 'priya.sharma@vc.in', 'investor', 'quarterly', NULL, ARRAY['bangalore', 'investor', 'angel'], 'Angel investor. Interested in AI/ML startups. Met at TechSummit.', now() - interval '95 days'),
    ('a1b2c3d4-0010-4000-8000-000000000010', 'Omar Farouk', '+971-52-789-0123', 'omar@farouk.me', 'friend', 'monthly', '1998-08-11', ARRAY['dubai', 'fitness', 'childhood-friend'], 'Childhood friend. Runs a fitness brand. Meet for padel on weekends.', now() - interval '18 days');

-- Contact Notes
INSERT INTO relationships.contact_notes (contact_id, note_type, content) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'preference', 'Prefers phone calls over WhatsApp messages'),
    ('a1b2c3d4-0001-4000-8000-000000000001', 'fact', 'Loves gardening and cooking Hyderabadi biryani'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'personality', 'Very direct communicator, appreciates honesty'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'fact', 'Allergic to shellfish'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'context', 'Currently raising Series A for his startup'),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'preference', 'Prefers formal tone in written communication'),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'fact', 'Has two daughters, both in college'),
    ('a1b2c3d4-0007-4000-8000-000000000007', 'personality', 'Patient and thoughtful. Likes structured agendas for meetings.'),
    ('a1b2c3d4-0007-4000-8000-000000000007', 'context', 'Writing a book on engineering management'),
    ('a1b2c3d4-0008-4000-8000-000000000008', 'preference', 'Communicates primarily on Slack and WhatsApp'),
    ('a1b2c3d4-0010-4000-8000-000000000010', 'fact', 'Runs the FitDubai brand on Instagram'),
    ('a1b2c3d4-0010-4000-8000-000000000010', 'preference', 'Prefers meeting in person over calls');

-- Interactions
INSERT INTO relationships.interactions (contact_id, type, date, quality_rating, duration_min, notes) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'call', CURRENT_DATE - interval '3 days', 5, 30, 'Talked about weekend plans and her new garden project'),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'call', CURRENT_DATE - interval '5 days', 4, 20, 'Quick catch-up about the cricket match and family news'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'meeting', CURRENT_DATE - interval '12 days', 5, 90, 'Had coffee at his office. Discussed his fundraising progress and tech stack decisions.'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'message', CURRENT_DATE - interval '2 days', 3, NULL, 'Shared an article about AI agents'),
    ('a1b2c3d4-0004-4000-8000-000000000004', 'call', CURRENT_DATE - interval '35 days', 4, 45, 'FaceTime catch-up. She got promoted to Staff Engineer at Stripe.'),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'email', CURRENT_DATE - interval '60 days', 4, NULL, 'Sent quarterly update on company metrics. He responded positively.'),
    ('a1b2c3d4-0006-4000-8000-000000000006', 'message', CURRENT_DATE - interval '45 days', 3, NULL, 'Exchanged messages about a design systems article she published.'),
    ('a1b2c3d4-0007-4000-8000-000000000007', 'meeting', CURRENT_DATE - interval '28 days', 5, 60, 'Monthly mentorship session. Discussed team scaling and hiring strategies.'),
    ('a1b2c3d4-0008-4000-8000-000000000008', 'meeting', CURRENT_DATE - interval '8 days', 4, 45, 'Branding project review. Finalized color palette and typography.'),
    ('a1b2c3d4-0009-4000-8000-000000000009', 'call', CURRENT_DATE - interval '95 days', 3, 25, 'Introductory call about potential investment. She wants to see more traction.'),
    ('a1b2c3d4-0010-4000-8000-000000000010', 'meeting', CURRENT_DATE - interval '18 days', 5, 120, 'Padel session followed by lunch. Great conversation about his brand expansion.');

-- Reminders
INSERT INTO relationships.reminders (contact_id, reminder_type, due_date, message, status) VALUES
    ('a1b2c3d4-0004-4000-8000-000000000004', 'frequency', CURRENT_DATE - interval '5 days', 'Monthly check-in overdue. Last talked 35 days ago. She recently got promoted — congratulate her.', 'pending'),
    ('a1b2c3d4-0006-4000-8000-000000000006', 'frequency', CURRENT_DATE - interval '15 days', 'Monthly check-in overdue. Last contacted 45 days ago. Ask about her design systems work.', 'pending'),
    ('a1b2c3d4-0009-4000-8000-000000000009', 'frequency', CURRENT_DATE, 'Quarterly update overdue for Priya. Last contact 95 days ago. Send progress update.', 'pending'),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'birthday', '2026-03-08', 'Arjun''s birthday on March 8. Send a message.', 'done'),
    ('a1b2c3d4-0010-4000-8000-000000000010', 'custom', CURRENT_DATE + interval '3 days', 'Schedule padel session with Omar this weekend.', 'pending'),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'custom', CURRENT_DATE + interval '10 days', 'Prepare and send Q1 investor update to Ravi.', 'pending');
