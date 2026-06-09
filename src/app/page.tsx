import { demoLeads } from '../data/demoLeads';
import { buildQueue } from '../domain/queue';

const queue = buildQueue(demoLeads, new Date('2026-06-09T14:00:00.000Z'));

const priorityColors = {
  high: '#b91c1c',
  medium: '#b45309',
  low: '#1d4ed8',
} as const;

function formatAge(ageHours: number) {
  if (ageHours >= 24) {
    const days = Math.floor(ageHours / 24);
    const hours = Math.round(ageHours % 24);
    return hours > 0 ? `${days}d ${hours}h ago` : `${days}d ago`;
  }

  return `${Math.round(ageHours)}h ago`;
}

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Sales Follow-Up Copilot</h1>
        <p style={{ color: '#4b5563', lineHeight: 1.5 }}>
          Manual-safe queue for deciding who should get the next follow-up first. Priority is based on lead status plus how long the lead has been waiting.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <strong>{queue.length}</strong>
          <div style={{ color: '#6b7280' }}>Active leads in queue</div>
        </div>
        <div style={{ padding: 16, border: '1px solid #fecaca', borderRadius: 12, background: '#fef2f2' }}>
          <strong>{queue.filter((item) => item.priority === 'high').length}</strong>
          <div style={{ color: '#991b1b' }}>High priority now</div>
        </div>
        <div style={{ padding: 16, border: '1px solid #fde68a', borderRadius: 12, background: '#fffbeb' }}>
          <strong>{queue.filter((item) => item.priority === 'medium').length}</strong>
          <div style={{ color: '#92400e' }}>Medium priority</div>
        </div>
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h2 style={{ margin: 0 }}>Next action queue</h2>
        </div>
        <div style={{ display: 'grid', gap: 1, background: '#e5e7eb' }}>
          {queue.map((item) => (
            <article key={item.lead.id} style={{ background: 'white', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0' }}>{item.lead.name}</h3>
                  <div style={{ color: '#6b7280' }}>{item.lead.email ?? 'No email on file'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 999, background: priorityColors[item.priority], color: 'white', fontSize: 12, textTransform: 'uppercase' }}>
                    {item.priority}
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
          ))}
        </div>
      </section>
    </main>
  );
}
