import { demoAuditLog } from '../data/demoAuditLog';
import { demoLeads } from '../data/demoLeads';
import { recentAuditEntries, summarizeAuditCoverage } from '../domain/audit';
import { needsAttention } from '../domain/queue';
import { listHotLeads } from '../domain/hot-lead';
import { buildQueue, groupQueueByPriority, type QueuePriority } from '../domain/queue';

const coverage = summarizeAuditCoverage(demoAuditLog);
const latestEvents = recentAuditEntries(demoAuditLog, 4);
const queue = needsAttention(demoLeads);
const queueGroups = groupQueueByPriority(queue);

const priorityColors = {
  high: '#b91c1c',
  medium: '#b45309',
  low: '#1d4ed8',
} as const;

const prioritySurface = {
  high: { border: '#fecaca', background: '#fef2f2', text: '#991b1b' },
  medium: { border: '#fde68a', background: '#fffbeb', text: '#92400e' },
  low: { border: '#bfdbfe', background: '#eff6ff', text: '#1d4ed8' },
} as const;

const laneCopy: Record<QueuePriority, { title: string; subtitle: string; empty: string }> = {
  high: {
    title: 'Act now',
    subtitle: 'Hot or replied leads that need the fastest human follow-up.',
    empty: 'No urgent leads right now.',
  },
  medium: {
    title: 'Queue next',
    subtitle: 'Leads that have momentum but can wait behind the urgent lane.',
    empty: 'No medium-priority leads waiting.',
  },
  low: {
    title: 'Warm up',
    subtitle: 'Newer opportunities that still need a first touch or light triage.',
    empty: 'No low-priority leads to warm up.',
  },
};

function formatAge(ageHours: number) {
  if (ageHours >= 24) {
    const days = Math.floor(ageHours / 24);
    const hours = Math.round(ageHours % 24);
    return hours > 0 ? `${days}d ${hours}h ago` : `${days}d ago`;
  }

  return `${Math.round(ageHours)}h ago`;
}

function QueueCard({ priority, item }: { priority: QueuePriority; item: (typeof queue)[number] }) {
  return (
    <article style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0' }}>{item.lead.name}</h3>
          <div style={{ color: '#6b7280' }}>{item.lead.email ?? 'No email on file'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: priorityColors[priority], color: 'white', fontSize: 12, textTransform: 'uppercase' }}>
            {priority}
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: '#e5e7eb', fontSize: 12, textTransform: 'capitalize' }}>
            {item.lead.status}
          </span>
        </div>
      </div>
      <p style={{ margin: '0 0 10px 0', color: '#374151' }}>{item.reason}</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: '#6b7280', fontSize: 14 }}>
        <span>Priority score: {Math.round(item.score)}</span>
        <span>Last activity: {formatAge(item.ageHours)}</span>
      </div>
    </article>
  );
}

export default function HomePage() {
  const stages = listFollowUpStages();

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', display: 'grid', gap: 24 }}>
      <section>
        <h1>Sales Follow-Up Copilot</h1>
        <p>Manual-safe MVP for managing leads, follow-up drafts, and a visible audit trail.</p>
      </section>

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="Tracked leads" value={String(demoLeads.length)} helper="Demo data seeded for local QA" />
        <MetricCard label="Audit events" value={String(coverage.totalEvents)} helper="Lead, draft, feedback, and system actions" />
        <MetricCard label="Queue items" value={String(queue.length)} helper="Leads currently needing attention" />
        <MetricCard label="Safety mode" value="manual" helper="Live outbound sending still blocked by default" />
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '2fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Recent audit log</h2>
          <p style={mutedStyle}>
            A lightweight operator-facing timeline for lead changes, draft actions, feedback capture, and runtime guard checks.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {latestEvents.map((entry) => (
              <li key={entry.id} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{entry.summary}</strong>
                  <span style={pillStyle}>{entry.action}</span>
                </div>
                <div style={{ ...mutedStyle, marginTop: 6 }}>
                  {entry.actor} · {entry.entityType} · {formatTimestamp(entry.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Audit coverage</h2>
            <ul>
              <li>Lead events: {coverage.leadEvents}</li>
              <li>Draft events: {coverage.followUpEvents}</li>
              <li>Feedback events: {coverage.feedbackEvents}</li>
              <li>Latest seed event: {formatTimestamp(coverage.latestEventAt ?? '')}</li>
            </ul>
          </div>

          <div>
            <h2>Why it matters</h2>
            <ul>
              <li>Lets operators explain what changed for each lead.</li>
              <li>Supports manual QA before any outbound workflow goes live.</li>
              <li>Preserves safety-mode checks in the same visible trail.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div style={panelStyle}>
      <div style={mutedStyle}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>{value}</div>
      <div style={mutedStyle}>{helper}</div>
    </div>
  );
}

function formatTimestamp(value: string) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
}

const panelStyle: React.CSSProperties = {
  border: '1px solid #d0d7de',
  borderRadius: 16,
  padding: 16,
  background: '#fff',
  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
};

const mutedStyle: React.CSSProperties = {
  color: '#57606a',
  fontSize: 14,
};

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  background: '#ddf4ff',
  color: '#0550ae',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
};
