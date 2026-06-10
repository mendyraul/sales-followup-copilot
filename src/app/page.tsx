import { demoLeads } from '../data/demoLeads';
import { listHotLeads } from '../domain/hot-lead';
import { needsAttention } from '../domain/queue';

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString();
}

export default function HomePage() {
  const hotLeads = listHotLeads(demoLeads);
  const queue = needsAttention(demoLeads);

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', display: 'grid', gap: 24 }}>
      <section>
        <h1 style={{ marginBottom: 8 }}>Sales Follow-Up Copilot</h1>
        <p style={{ maxWidth: 760, lineHeight: 1.5, margin: 0 }}>
          Manual-safe MVP for surfacing who needs outreach next and which leads deserve immediate hot-lead attention.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <article style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, background: '#fff7ed' }}>
          <div style={{ fontSize: 13, color: '#9a3412', fontWeight: 700 }}>HOT LEADS</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{hotLeads.length}</div>
          <div style={{ color: '#7c2d12', marginTop: 6 }}>Leads that should be reviewed before the normal queue.</div>
        </article>
        <article style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, background: '#eff6ff' }}>
          <div style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 700 }}>NEXT ACTION QUEUE</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{queue.length}</div>
          <div style={{ color: '#1e3a8a', marginTop: 6 }}>Prioritized by stage urgency plus time since the last update.</div>
        </article>
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Hot-lead review</h2>
        <p style={{ color: '#555', marginTop: 0 }}>Visible flags keep the best opportunities from getting buried in a longer queue.</p>
        {hotLeads.length ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {hotLeads.map((lead) => (
              <article key={lead.id} style={{ border: '1px solid #fed7aa', borderRadius: 10, padding: 14, background: '#fff7ed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{lead.name}</strong>
                    <div style={{ color: '#7c2d12', marginTop: 4 }}>{lead.hotLeadFlag.reason}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#9a3412' }}>Score {lead.hotLeadFlag.score}</div>
                </div>
                <div style={{ marginTop: 8, color: '#555' }}>Status: {lead.status} · Last updated: {timeLabel(lead.updatedAt)}</div>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ marginBottom: 0 }}>No hot leads right now.</p>
        )}
      </section>

      <section style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Follow-up queue</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {queue.map((lead, index) => {
            const hot = hotLeads.some((item) => item.id === lead.id);
            return (
              <article key={lead.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{index + 1}. {lead.name}</strong>
                    {hot ? <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: '#f97316', color: 'white', fontSize: 12, fontWeight: 700 }}>HOT</span> : null}
                    <div style={{ color: '#555', marginTop: 4 }}>Status: {lead.status} · Updated: {timeLabel(lead.updatedAt)}</div>
                    <div style={{ color: '#111827', marginTop: 6, fontWeight: 600 }}>{lead.nextAction.label}</div>
                    <div style={{ color: '#6b7280', marginTop: 4 }}>{lead.nextAction.reason}</div>
                    <div style={{ color: '#4b5563', marginTop: 4, fontSize: 13 }}>Follow-up stage: {lead.nextAction.followUpStage}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>Queue score {Math.round(lead.nextAction.score)}</div>
                    <div style={{ color: lead.nextAction.band === 'urgent' ? '#b91c1c' : lead.nextAction.band === 'today' ? '#1d4ed8' : '#047857', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}>
                      {lead.nextAction.band}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
