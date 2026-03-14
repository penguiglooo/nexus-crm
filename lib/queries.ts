import { supabase } from '@/lib/supabase/client';
import type { Contact, ContactWithHealth, ContactNote, Interaction, Reminder, MessageDraft, BulkAction, DashboardStats, HealthStatus } from '@/lib/types';
import { HEALTH_THRESHOLDS } from '@/lib/constants';

// ============================================================
// Health computation (pure function)
// ============================================================

export function computeHealth(contact: Contact): { health: HealthStatus; days_since_contact: number | null; days_overdue: number | null } {
  if (!contact.frequency_goal) {
    return { health: 'neutral', days_since_contact: contact.last_interaction_at ? daysSince(contact.last_interaction_at) : null, days_overdue: null };
  }

  const thresholds = HEALTH_THRESHOLDS[contact.frequency_goal];
  if (!thresholds) return { health: 'neutral', days_since_contact: null, days_overdue: null };

  const [healthyDays, staleDays] = thresholds;
  const daysSinceContact = contact.last_interaction_at ? daysSince(contact.last_interaction_at) : Infinity;

  let health: HealthStatus;
  if (daysSinceContact <= healthyDays) health = 'healthy';
  else if (daysSinceContact <= staleDays) health = 'stale';
  else health = 'neglected';

  const days_overdue = daysSinceContact > healthyDays ? Math.round(daysSinceContact - healthyDays) : null;

  return {
    health,
    days_since_contact: daysSinceContact === Infinity ? null : Math.round(daysSinceContact),
    days_overdue,
  };
}

function daysSince(isoTimestamp: string): number {
  const then = new Date(isoTimestamp);
  const now = new Date();
  return (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
}

// ============================================================
// Contacts
// ============================================================

export async function getContacts(): Promise<ContactWithHealth[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data || []).map(enrichWithHealth);
}

export async function getContact(id: string): Promise<ContactWithHealth | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return enrichWithHealth(data);
}

export async function searchContacts(query: string): Promise<ContactWithHealth[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');

  if (error) throw error;
  return (data || []).map(enrichWithHealth);
}

export async function createContact(contact: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

function enrichWithHealth(contact: Contact): ContactWithHealth {
  const { health, days_since_contact, days_overdue } = computeHealth(contact);
  return { ...contact, health, days_since_contact, days_overdue };
}

// ============================================================
// Contact Notes
// ============================================================

export async function getContactNotes(contactId: string): Promise<ContactNote[]> {
  const { data, error } = await supabase
    .from('contact_notes')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addContactNote(note: Omit<ContactNote, 'id' | 'created_at'>): Promise<ContactNote> {
  const { data, error } = await supabase
    .from('contact_notes')
    .insert(note)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContactNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('contact_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Interactions
// ============================================================

export async function getInteractions(contactId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function logInteraction(interaction: Omit<Interaction, 'id' | 'created_at'>): Promise<Interaction> {
  const { data, error } = await supabase
    .from('interactions')
    .insert(interaction)
    .select()
    .single();

  if (error) throw error;

  // Update last_interaction_at on the contact
  await supabase
    .from('contacts')
    .update({ last_interaction_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', interaction.contact_id);

  return data;
}

// ============================================================
// Reminders
// ============================================================

export async function getReminders(filter?: 'pending' | 'dismissed' | 'done'): Promise<(Reminder & { contact: Contact })[]> {
  let query = supabase
    .from('reminders')
    .select('*, contact:contacts(*)');

  if (filter) {
    query = query.eq('status', filter);
  }

  const { data, error } = await query.order('due_date');

  if (error) throw error;
  return data || [];
}

export async function updateReminder(id: string, status: 'pending' | 'dismissed' | 'done'): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'created_at' | 'contact'>): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminder)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Message Drafts
// ============================================================

export async function getMessageDrafts(filter?: 'pending' | 'approved' | 'sent' | 'dismissed'): Promise<(MessageDraft & { contact: Contact })[]> {
  let query = supabase
    .from('message_drafts')
    .select('*, contact:contacts(*)');

  if (filter) {
    query = query.eq('status', filter);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDraft(draft: Omit<MessageDraft, 'id' | 'created_at' | 'contact'>): Promise<MessageDraft> {
  const { data, error } = await supabase
    .from('message_drafts')
    .insert(draft)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDraft(id: string, updates: Partial<MessageDraft>): Promise<MessageDraft> {
  const { data, error } = await supabase
    .from('message_drafts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Bulk Actions
// ============================================================

export async function createBulkAction(action: Omit<BulkAction, 'id' | 'created_at'>): Promise<BulkAction> {
  const { data, error } = await supabase
    .from('bulk_actions')
    .insert(action)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBulkAction(id: string, updates: Partial<BulkAction>): Promise<void> {
  const { error } = await supabase
    .from('bulk_actions')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

// ============================================================
// Dashboard Queries
// ============================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const contacts = await getContacts();
  return {
    total_contacts: contacts.length,
    healthy_count: contacts.filter(c => c.health === 'healthy').length,
    stale_count: contacts.filter(c => c.health === 'stale').length,
    neglected_count: contacts.filter(c => c.health === 'neglected').length,
  };
}

export async function getContactsNeedingAttention(limit = 5): Promise<ContactWithHealth[]> {
  const contacts = await getContacts();
  return contacts
    .filter(c => c.health === 'neglected' || c.health === 'stale')
    .sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0))
    .slice(0, limit);
}

export async function getUpcomingBirthdays(days = 30): Promise<ContactWithHealth[]> {
  const contacts = await getContacts();
  const today = new Date();

  return contacts.filter(c => {
    if (!c.birthday) return false;
    const bday = new Date(c.birthday);
    // Set birthday to this year
    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    // If already passed this year, check next year
    if (thisYearBday < today) {
      thisYearBday.setFullYear(today.getFullYear() + 1);
    }
    const daysUntil = (thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil <= days;
  }).sort((a, b) => {
    const aBday = getNextBirthday(a.birthday!);
    const bBday = getNextBirthday(b.birthday!);
    return aBday.getTime() - bBday.getTime();
  });
}

function getNextBirthday(birthday: string): Date {
  const today = new Date();
  const bday = new Date(birthday);
  const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  return thisYear;
}

export async function getRecentInteractions(limit = 10): Promise<(Interaction & { contact: Contact })[]> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*, contact:contacts(*)')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
