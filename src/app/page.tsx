import { demoLeads } from '../data/demoLeads';
import { staleLeadSummary } from '../domain/stale';

const staleLeads = staleLeadSummary(demoLeads, {
  staleAfterDays: 7,
  now: new Date('2026-06-09T12:00:00.000Z')
});

function reasonLabel(reason: string): string {
  switch (reason) {
    case 'missing-activity':
      return 'No activity recorded';
    case 'inactive-window':
      return 'Follow-up window exceeded';
    default:
      return 'Closed lead';
  }
}

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', display: 'grid', gap: 24 }}>
      <section>
        <h1>Sales Follow-Up Copilot</h1>
        <p>Manual-safe MVP for keeping follow-ups moving without letting leads go cold.</p>
      </section>

      <section>
        <h2>Stale lead detection</h2>
        <p>
          {staleLeads.length > 0
            ? `${staleLeads.length} lead${staleLeads.length === 1 ? '' : 's'} need attention right now.`
            : 'No stale leads in the current demo queue.'}
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {staleLeads.map((entry) => (
            <article
              key={entry.lead.id}
              style={{ border: '1px solid #d1d5db', borderRadius: 12, padding: 16, background: '#fff7ed' }}
            >
              <strong>{entry.lead.name}</strong>
              <div>Status: {entry.lead.status}</div>
              <div>Inactive for {entry.staleDays} day{entry.staleDays === 1 ? '' : 's'}</div>
              <div>Reason: {reasonLabel(entry.reason)}</div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Demo pipeline snapshot</h2>
        <ul>
          {demoLeads.map((lead) => (
            <li key={lead.id}>
              {lead.name} — {lead.status}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
