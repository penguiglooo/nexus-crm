export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: 'friend' | 'family' | 'colleague' | 'investor' | 'mentor' | 'other';
  frequency_goal: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  birthday: string | null; // date string YYYY-MM-DD
  tags: string[];
  notes: string | null;
  last_interaction_at: string | null; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export type HealthStatus = 'healthy' | 'stale' | 'neglected' | 'neutral';

export interface ContactWithHealth extends Contact {
  health: HealthStatus;
  days_since_contact: number | null;
  days_overdue: number | null;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  note_type: 'fact' | 'preference' | 'personality' | 'context';
  content: string;
  created_at: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  type: 'call' | 'meeting' | 'message' | 'email' | 'other';
  date: string; // YYYY-MM-DD
  quality_rating: number | null; // 1-5
  duration_min: number | null;
  notes: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  contact_id: string;
  reminder_type: 'frequency' | 'birthday' | 'custom';
  due_date: string; // YYYY-MM-DD
  message: string | null;
  status: 'pending' | 'dismissed' | 'done';
  created_at: string;
  // Joined
  contact?: Contact;
}

export interface MessageDraft {
  id: string;
  contact_id: string;
  occasion: 'birthday' | 'checkin' | 'followup' | 'custom';
  draft_text: string;
  bulk_action_id: string | null;
  status: 'pending' | 'approved' | 'sent' | 'dismissed';
  created_at: string;
  // Joined
  contact?: Contact;
}

export interface BulkAction {
  id: string;
  action_type: 'message' | 'birthday_wish' | 'new_year' | 'custom';
  filter_category: string | null;
  template: string;
  total_contacts: number;
  drafts_created: number;
  drafts_approved: number;
  status: 'drafting' | 'pending_approval' | 'completed' | 'cancelled';
  created_at: string;
}

export interface DashboardStats {
  total_contacts: number;
  healthy_count: number;
  stale_count: number;
  neglected_count: number;
}
