import { demoLeads } from '../data/demoLeads';

import { listHotLeads } from '../domain/hot-lead';
import { buildQueue, groupQueueByPriority, type QueuePriority } from '../domain/queue';


const queue = buildQueue(demoLeads, new Date('2026-06-09T14:00:00.000Z'));
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
    <main style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 1120, margin: '0 auto' }}>
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
        <div style={{ padding: 16, border: `1px solid ${prioritySurface.high.border}`, borderRadius: 12, background: prioritySurface.high.background }}>
          <strong>{queueGroups.high.length}</strong>
          <div style={{ color: prioritySurface.high.text }}>High priority now</div>
        </div>
        <div style={{ padding: 16, border: `1px solid ${prioritySurface.medium.border}`, borderRadius: 12, background: prioritySurface.medium.background }}>
          <strong>{queueGroups.medium.length}</strong>
          <div style={{ color: prioritySurface.medium.text }}>Medium priority</div>
        </div>
        <div style={{ padding: 16, border: `1px solid ${prioritySurface.low.border}`, borderRadius: 12, background: prioritySurface.low.background }}>
          <strong>{queueGroups.low.length}</strong>
          <div style={{ color: prioritySurface.low.text }}>Low priority</div>
        </div>
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
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {(['high', 'medium', 'low'] as const).map((priority) => {
          const lane = queueGroups[priority];
          const surface = prioritySurface[priority];
          const copy = laneCopy[priority];

          return (
            <section key={priority} style={{ border: `1px solid ${surface.border}`, borderRadius: 16, overflow: 'hidden', background: surface.background }}>
              <div style={{ padding: 16, borderBottom: `1px solid ${surface.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <h2 style={{ margin: 0 }}>{copy.title}</h2>
                  <span style={{ padding: '4px 10px', borderRadius: 999, background: priorityColors[priority], color: 'white', fontSize: 12, textTransform: 'uppercase' }}>
                    {lane.length}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.5 }}>{copy.subtitle}</p>
              </div>
              <div style={{ padding: 16, display: 'grid', gap: 12 }}>
                {lane.length > 0 ? lane.map((item) => <QueueCard key={item.lead.id} priority={priority} item={item} />) : <div style={{ color: '#6b7280' }}>{copy.empty}</div>}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
