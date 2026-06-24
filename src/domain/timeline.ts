export type LeadTimelineEventType =
  | 'lead_created'
  | 'status_changed'
  | 'note_added'
  | 'follow_up_drafted'
  | 'follow_up_reviewed'
  | 'feedback_captured';

export type LeadTimelineEntry = {
  id: string;
  leadId: string;
  type: LeadTimelineEventType;
  actor: string;
  summary: string;
  createdAt: string;
};

export type LeadNoteEntry = {
  id: string;
  leadId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
};

export function summarizeTimeline(entries: LeadTimelineEntry[], notes: LeadNoteEntry[]) {
  return {
    totalEvents: entries.length,
    totalNotes: notes.length,
    lastUpdatedAt: [...entries, ...notes]
      .map((entry) => ('updatedAt' in entry && entry.updatedAt ? entry.updatedAt : entry.createdAt))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null,
  };
}

export function entriesForLead(entries: LeadTimelineEntry[], leadId: string) {
  return entries
    .filter((entry) => entry.leadId === leadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function notesForLead(notes: LeadNoteEntry[], leadId: string) {
  return notes
    .filter((note) => note.leadId === leadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function notePreview(note: LeadNoteEntry, maxLength = 88) {
  const cleaned = note.body.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1)}…`;
}
