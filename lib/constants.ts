export const CONTACT_CATEGORIES = [
  { value: 'friend', label: 'Friend', color: 'bg-blue-500' },
  { value: 'family', label: 'Family', color: 'bg-purple-500' },
  { value: 'colleague', label: 'Colleague', color: 'bg-cyan-500' },
  { value: 'investor', label: 'Investor', color: 'bg-amber-500' },
  { value: 'mentor', label: 'Mentor', color: 'bg-emerald-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' },
] as const;

export const FREQUENCY_GOALS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const INTERACTION_TYPES = [
  { value: 'call', label: 'Call', icon: 'Phone' },
  { value: 'meeting', label: 'Meeting', icon: 'Users' },
  { value: 'message', label: 'Message', icon: 'MessageSquare' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
] as const;

export const NOTE_TYPES = [
  { value: 'fact', label: 'Fact', icon: 'Info', description: 'Factual information' },
  { value: 'preference', label: 'Preference', icon: 'Heart', description: 'Likes/dislikes' },
  { value: 'personality', label: 'Personality', icon: 'User', description: 'Character traits' },
  { value: 'context', label: 'Context', icon: 'FileText', description: 'Situational context' },
] as const;

export const DRAFT_OCCASIONS = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'custom', label: 'Custom' },
] as const;

// Health scoring thresholds: [healthyDays, staleDays]
// Beyond staleDays = neglected
export const HEALTH_THRESHOLDS: Record<string, [number, number]> = {
  weekly: [10, 21],
  biweekly: [21, 42],
  monthly: [45, 90],
  quarterly: [120, 240],
  yearly: [400, 600],
};
