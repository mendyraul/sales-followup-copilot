import { describe, expect, it } from 'vitest';
import { demoLeadNotes, demoTimelineEntries } from '../data/demoTimeline';
import { entriesForLead, notePreview, notesForLead, summarizeTimeline } from '../domain/timeline';

describe('timeline helpers', () => {
  it('summarizes seeded notes and events for dashboard metrics', () => {
    const summary = summarizeTimeline(demoTimelineEntries, demoLeadNotes);

    expect(summary).toMatchObject({
      totalEvents: 5,
      totalNotes: 3,
      lastUpdatedAt: '2026-06-10T07:12:00.000Z',
    });
  });

  it('returns newest-first notes and timeline entries per lead', () => {
    const leadThreeNotes = notesForLead(demoLeadNotes, 'lead-demo-003');
    const leadThreeEvents = entriesForLead(demoTimelineEntries, 'lead-demo-003');

    expect(leadThreeNotes.map((note) => note.id)).toEqual(['note-003']);
    expect(leadThreeEvents.map((event) => event.id)).toEqual(['timeline-005', 'timeline-004', 'timeline-003']);
  });

  it('builds a stable note preview for dashboard cards', () => {
    expect(notePreview(demoLeadNotes[2], 40)).toBe('Champion asked for a softer tone and a …');
  });
});
