import { demoAuditLog } from '../data/demoAuditLog';
import { demoLeads } from '../data/demoLeads';
import { recentAuditEntries, summarizeAuditCoverage } from '../domain/audit';
import { needsAttention } from '../domain/queue';

const coverage = summarizeAuditCoverage(demoAuditLog);
const latestEvents = recentAuditEntries(demoAuditLog, 4);
const queue = needsAttention(demoLeads);

export default function HomePage() {
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
