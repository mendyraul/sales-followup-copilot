export type AuditEntityType = 'lead' | 'follow_up_draft' | 'feedback' | 'system';

export type AuditAction =
  | 'lead_created'
  | 'lead_status_changed'
  | 'follow_up_drafted'
  | 'follow_up_approved'
  | 'follow_up_rejected'
  | 'feedback_captured'
  | 'note_added'
  | 'system_mode_checked';

export type AuditLogEntry = {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  actor: string;
  summary: string;
  createdAt: string;
  payload?: Record<string, unknown>;
};

export function createAuditEntry(input: Omit<AuditLogEntry, 'id' | 'createdAt'> & { createdAt?: string; id?: string }): AuditLogEntry {
  const summary = input.summary.trim();

  if (!summary) {
    throw new Error('Audit summary is required');
  }

  return {
    id: input.id ?? buildAuditId(input.action, input.entityId),
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    actor: input.actor,
    summary,
    createdAt: input.createdAt ?? new Date().toISOString(),
    payload: input.payload,
  };
}

export function buildAuditId(action: AuditAction, entityId?: string): string {
  const slug = entityId?.trim() || 'system';
  return `${action}:${slug}`;
}

export function summarizeAuditCoverage(entries: AuditLogEntry[]) {
  return {
    totalEvents: entries.length,
    leadEvents: entries.filter((entry) => entry.entityType === 'lead').length,
    followUpEvents: entries.filter((entry) => entry.entityType === 'follow_up_draft').length,
    feedbackEvents: entries.filter((entry) => entry.entityType === 'feedback').length,
    latestEventAt: entries[0]?.createdAt,
  };
}

export function recentAuditEntries(entries: AuditLogEntry[], limit = 5): AuditLogEntry[] {
  return [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
