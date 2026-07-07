import React from 'react';
import { demoAuditLog } from '../data/demoAuditLog';
import { demoDeploymentChecklist } from '../data/demoDeploymentChecklist';
import { demoFeedbackEntries } from '../data/demoFeedback';
import { demoLeads } from '../data/demoLeads';
import { demoManualQaChecklist } from '../data/demoManualQaChecklist';
import { demoLeadNotes, demoTimelineEntries } from '../data/demoTimeline';
import { recentAuditEntries, summarizeAuditCoverage } from '../domain/audit';
import { parseLeadCsvPreview } from '../domain/csv-import';
import { summarizeDeploymentChecklist } from '../domain/deployment';
import { feedbackActionHint, feedbackEscalation, feedbackHotspots, feedbackNeedsAttention, recentFeedback, summarizeFeedback, summarizeFeedbackEscalations } from '../domain/feedback';
import { buildDemoFirstFollowupDraft } from '../../lib/firstFollowupDraft';
import { summarizeManualQaChecklist } from '../domain/manual-qa';
import { entriesForLead, notePreview, notesForLead, summarizeTimeline } from '../domain/timeline';
import { listHotLeads } from '../domain/hot-lead';
import { buildQueue, groupQueueByPriority, type QueuePriority } from '../domain/queue';

const coverage = summarizeAuditCoverage(demoAuditLog);
const latestEvents = recentAuditEntries(demoAuditLog, 4);
const deploymentSummary = summarizeDeploymentChecklist(demoDeploymentChecklist);
const feedbackSummary = summarizeFeedback(demoFeedbackEntries);
const feedbackEscalationSummary = summarizeFeedbackEscalations(demoFeedbackEntries);
const latestFeedback = recentFeedback(demoFeedbackEntries);
const feedbackFollowUps = feedbackNeedsAttention(demoFeedbackEntries);
const feedbackLeadHotspots = feedbackHotspots(demoFeedbackEntries);
const manualQaSummary = summarizeManualQaChecklist(demoManualQaChecklist);
const timelineSummary = summarizeTimeline(demoTimelineEntries, demoLeadNotes);
const draftPreviewLead = demoLeads.find((lead) => lead.id === 'lead-demo-002') ?? demoLeads[0];
const draftPreviewNote = notesForLead(demoLeadNotes, draftPreviewLead.id)[0];
const firstFollowupDraft = buildDemoFirstFollowupDraft({
  leadName: draftPreviewLead.name,
  companyName: 'Northwind',
  recentContext: draftPreviewNote?.body,
  desiredNextStep: 'sending a concise recap and booking a short review',
  tone: 'direct'
});
const csvPreview = parseLeadCsvPreview(`name,email,phone,source,status
Avery Smith,avery@example.com,+1-555-0101,Referral,new
Jordan Lee,jordan@example.com,,Website,contacted
Pat Rivera,pat@example.com,+1-555-0104,"Partner, East",hot
Jordan Lee,jordan@example.com,+1-555-0102,,replied
No Email,,+1-555-0110,Tradeshow,new`);
const queue = buildQueue(demoLeads);
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
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif', display: 'grid', gap: 24 }}>
      <section>
        <h1>Sales Follow-Up Copilot</h1>
        <p>Manual-safe MVP for managing leads, follow-up drafts, and a visible audit trail.</p>
      </section>

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <MetricCard label="Tracked leads" value={String(demoLeads.length)} helper="Demo data seeded for local QA" />
        <MetricCard label="Audit events" value={String(coverage.totalEvents)} helper="Lead, draft, feedback, and system actions" />
        <MetricCard label="Timeline events" value={String(timelineSummary.totalEvents)} helper="Status, draft, and review history by lead" />
        <MetricCard label="Structured notes" value={String(timelineSummary.totalNotes)} helper="Operator notes attached to active leads" />
        <MetricCard label="Queue items" value={String(queue.length)} helper="Leads currently needing attention" />
        <MetricCard label="CSV preview rows" value={String(csvPreview.validRows.length)} helper="Validated leads ready for import" />
        <MetricCard label="Feedback entries" value={String(feedbackSummary.total)} helper="Operator + QA input captured for iteration" />
        <MetricCard label="Manual QA checks" value={String(manualQaSummary.totalItems)} helper="Seeded release checklist items" />
        <MetricCard label="Deploy checkpoints" value={String(deploymentSummary.totalItems)} helper="Release guardrails for manual-safe rollout" />
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

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.3fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>First follow-up draft preview</h2>
          <p style={mutedStyle}>
            A seeded manual-safe draft preview keeps issue `#11` visible in the dashboard without enabling live delivery. Operators can review subject/body/copy guardrails before touching any send mode.
          </p>
          <div style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <strong>{draftPreviewLead.name}</strong>
                <div style={mutedStyle}>{draftPreviewLead.status.toUpperCase()} · {draftPreviewLead.email ?? 'no-email'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={pillStyle}>{firstFollowupDraft.provider}</span>
                <span style={warningPillStyle}>manual review</span>
              </div>
            </div>

            <div>
              <div style={{ ...mutedStyle, marginBottom: 4 }}>Subject</div>
              <div><strong>{firstFollowupDraft.subject}</strong></div>
            </div>

            <div>
              <div style={{ ...mutedStyle, marginBottom: 4 }}>Draft body</div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#f8fafc', borderRadius: 12, padding: 12, border: '1px solid #e2e8f0' }}>
                {firstFollowupDraft.body}
              </pre>
            </div>

            <div>
              <div style={{ ...mutedStyle, marginBottom: 4 }}>Review checklist</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {firstFollowupDraft.reviewChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ ...mutedStyle }}>
              <strong>Warning:</strong> {firstFollowupDraft.warnings.join(' · ')}
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Draft QA prompts</h2>
            <ul>
              <li>Keep the preview in `mock` mode during demos and QA.</li>
              <li>Confirm the note context carries into the opening sentence.</li>
              <li>Verify the CTA still matches the requested manual next step.</li>
            </ul>
          </div>

          <div>
            <h2>Coverage</h2>
            <ul>
              <li>Seeded lead: {draftPreviewLead.name}</li>
              <li>Provider: {firstFollowupDraft.provider}</li>
              <li>Warnings shown: {firstFollowupDraft.warnings.length}</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.3fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Lead timeline</h2>
          <p style={mutedStyle}>
            Every seeded lead now carries visible notes plus a human-readable activity trail for reviews, demos, and manual QA.
          </p>
          <div style={{ display: 'grid', gap: 16 }}>
            {demoLeads.map((lead) => {
              const leadNotes = notesForLead(demoLeadNotes, lead.id);
              const leadEvents = entriesForLead(demoTimelineEntries, lead.id);
              return (
                <article key={lead.id} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{lead.name}</strong>
                      <div style={mutedStyle}>{lead.status.toUpperCase()} · {lead.email ?? 'no-email'}</div>
                    </div>
                    <span style={pillStyle}>{leadEvents.length} timeline events</span>
                  </div>

                  <div>
                    <div style={{ ...mutedStyle, marginBottom: 4 }}>Latest note</div>
                    <div>{leadNotes[0] ? notePreview(leadNotes[0]) : 'No operator notes yet.'}</div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                    {leadEvents.slice(0, 3).map((event) => (
                      <li key={event.id} style={{ borderTop: '1px solid #d8dee4', paddingTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <strong>{event.summary}</strong>
                          <span style={miniPillStyle}>{event.type}</span>
                        </div>
                        <div style={{ ...mutedStyle, marginTop: 4 }}>{event.actor} · {formatTimestamp(event.createdAt)}</div>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Timeline summary</h2>
            <ul>
              <li>Total timeline events: {timelineSummary.totalEvents}</li>
              <li>Total structured notes: {timelineSummary.totalNotes}</li>
              <li>Latest timeline update: {formatTimestamp(timelineSummary.lastUpdatedAt ?? '')}</li>
            </ul>
          </div>

          <div>
            <h2>Manual QA prompts</h2>
            <ul>
              <li>Confirm each lead card shows a recent note preview.</li>
              <li>Confirm timeline events stay newest-first per lead.</li>
              <li>Confirm draft review history appears without enabling live sending.</li>
            </ul>
          </div>
        </div>
      </section>


      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.4fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Manual QA checklist</h2>
          <p style={mutedStyle}>
            A release-friendly checklist for demo runs and branch promotion so operators can verify the MVP without enabling live outbound delivery.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {demoManualQaChecklist.map((item) => (
              <li key={item.id} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{item.title}</strong>
                  <span style={item.status === 'ready' ? pillStyle : warningPillStyle}>{item.status}</span>
                </div>
                <div style={{ ...mutedStyle, marginTop: 6 }}>{item.whyItMatters}</div>
                <div style={{ marginTop: 8 }}><strong>Verify:</strong> {item.verification}</div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Checklist coverage</h2>
            <ul>
              <li>Total checkpoints: {manualQaSummary.totalItems}</li>
              <li>Ready checkpoints: {manualQaSummary.readyItems}</li>
              <li>Watch items: {manualQaSummary.watchItems}</li>
              <li>Areas covered: {manualQaSummary.areas.join(', ')}</li>
            </ul>
          </div>

          <div>
            <h2>Runbook</h2>
            <ul>
              <li>Checklist doc: <code>docs/manual-qa.md</code></li>
              <li>Regression commands: <code>npm test -- --run</code> and <code>npm run build</code></li>
              <li>Leave <code>SEND_MODE=manual</code> in place for normal QA.</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.2fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Feedback follow-up queue</h2>
          <p style={mutedStyle}>
            Negative or low-score feedback is promoted into a lightweight triage queue so operators know which review notes need action before the next demo.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {feedbackFollowUps.map((entry) => {
              const lead = demoLeads.find((candidate) => candidate.id === entry.leadId);
              return (
                <li key={entry.id} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{lead?.name ?? 'Unlinked feedback'}</strong>
                      {lead ? <div style={{ ...mutedStyle, marginTop: 4 }}>{lead.status.toUpperCase()} · {lead.email ?? 'no-email'}</div> : null}
                    </div>
                    <span style={feedbackEscalation(entry) === 'urgent' ? warningPillStyle : miniPillStyle}>{feedbackEscalation(entry)}</span>
                  </div>
                  <div style={{ ...mutedStyle, marginTop: 6 }}>
                    {entry.category.replace('_', ' ')} · {entry.source} · score {entry.score ?? 'n/a'}
                  </div>
                  <div style={{ marginTop: 8 }}>{entry.message}</div>
                  <div style={{ ...mutedStyle, marginTop: 8 }}><strong>Next step:</strong> {feedbackActionHint(entry)}</div>
                  <div style={{ ...mutedStyle, marginTop: 6 }}><strong>Triage state:</strong> {feedbackEscalation(entry) === 'urgent' ? 'Overdue review item' : 'Active review item'}</div>
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Triage prompts</h2>
            <ul>
              <li>Review negative or score-3-and-below entries before the next demo.</li>
              <li>Check whether the linked lead still needs a draft, copy tweak, or product bug fix.</li>
              <li>Keep the queue manual-safe: feedback informs humans, it does not auto-send.</li>
            </ul>
          </div>

          <div>
            <h2>Escalation snapshot</h2>
            <ul>
              <li>Urgent items: {feedbackEscalationSummary.urgent}</li>
              <li>Watch items: {feedbackEscalationSummary.watch}</li>
              <li>Fresh items: {feedbackEscalationSummary.fresh}</li>
              <li>Oldest open note: {formatTimestamp(feedbackEscalationSummary.oldestOpenAt ?? '')}</li>
            </ul>
          </div>

          <div>
            <h2>Coverage</h2>
            <ul>
              <li>Queued unresolved items: {feedbackFollowUps.length}</li>
              <li>Newest feedback signal: {formatTimestamp(feedbackSummary.latestAt ?? '')}</li>
              <li>Primary source: seeded inbox + summary helpers in <code>src/domain/feedback.ts</code></li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.4fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Deployment readiness</h2>
          <p style={mutedStyle}>
            A manual-safe release checklist for staging or production so the team can promote stacked PR work without guessing at env, migration, smoke-test, or rollback steps.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {demoDeploymentChecklist.map((item) => (
              <li key={item.id} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{item.title}</strong>
                  <span style={item.status === 'ready' ? pillStyle : warningPillStyle}>{item.status}</span>
                </div>
                <div style={{ ...mutedStyle, marginTop: 6 }}>{item.whyItMatters}</div>
                <div style={{ marginTop: 8 }}><strong>Verify:</strong> {item.verification}</div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Release summary</h2>
            <ul>
              <li>Total checkpoints: {deploymentSummary.totalItems}</li>
              <li>Ready checkpoints: {deploymentSummary.readyItems}</li>
              <li>Watch items: {deploymentSummary.watchItems}</li>
              <li>Areas covered: {deploymentSummary.areas.join(', ')}</li>
            </ul>
          </div>

          <div>
            <h2>Runbook</h2>
            <ul>
              <li>Deployment doc: <code>docs/deployment.md</code></li>
              <li>Preflight commands: <code>npm test -- --run</code> and <code>npm run build</code></li>
              <li>Database step: <code>npx prisma migrate deploy</code></li>
              <li>Rollback rule: keep the previous good branch or artifact ready before promoting the next stacked slice.</li>
            </ul>
          </div>
        </div>
      </section>


      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.2fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Feedback hotspots</h2>
          <p style={mutedStyle}>
            Repeated feedback on the same lead stays grouped so reviewers can see which conversations still need copy changes, bug fixes, or manual follow-up before the next demo.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {feedbackLeadHotspots.map((hotspot) => {
              const lead = demoLeads.find((candidate) => candidate.id === hotspot.leadId);
              return (
                <li key={hotspot.leadId} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{lead?.name ?? hotspot.leadId}</strong>
                      <div style={{ ...mutedStyle, marginTop: 4 }}>{lead ? `${lead.status.toUpperCase()} · ${lead.email ?? 'no-email'}` : 'Linked lead unavailable'}</div>
                    </div>
                    <span style={hotspot.openEntries > 0 ? warningPillStyle : miniPillStyle}>
                      {hotspot.openEntries} open
                    </span>
                  </div>
                  <div style={{ ...mutedStyle, marginTop: 8 }}>
                    {hotspot.totalEntries} total entries · {hotspot.negativeEntries} negative · latest {formatTimestamp(hotspot.latestAt)}
                  </div>
                  <div style={{ ...mutedStyle, marginTop: 6 }}>
                    {hotspot.openEntries > 1
                      ? 'Repeated open notes suggest a draft/content fix should land before the next outreach.'
                      : 'Single open note: confirm the reviewer concern is addressed before the next demo.'}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Repeat issue watchlist</h2>
            <ul>
              <li>Review leads with multiple open feedback notes before drafting again.</li>
              <li>Use repeated negatives to separate product bugs from copy-quality issues.</li>
              <li>Close the loop manually once the reviewer confirms the fix.</li>
            </ul>
          </div>

          <div>
            <h2>Coverage</h2>
            <ul>
              <li>Tracked hotspots: {feedbackLeadHotspots.length}</li>
              <li>Most urgent lead: {demoLeads.find((lead) => lead.id === feedbackLeadHotspots[0]?.leadId)?.name ?? 'n/a'}</li>
              <li>Source data: <code>src/domain/feedback.ts</code> grouped by linked lead</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.4fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Feedback capture inbox</h2>
          <p style={mutedStyle}>
            Reviewers can flag UX, bug, or draft-quality issues without leaving the manual-safe workflow. The seeded inbox keeps score, sentiment, source, and linked lead context visible.
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
            {latestFeedback.map((entry) => {
              const lead = demoLeads.find((candidate) => candidate.id === entry.leadId);
              return (
                <li key={entry.id} style={{ border: '1px solid #d0d7de', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{entry.category.replace('_', ' ')}</strong>
                      <div style={{ ...mutedStyle, marginTop: 4 }}>
                        {lead ? `${lead.name} · ${lead.status.toUpperCase()}` : 'Unlinked feedback'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={entry.sentiment === 'negative' ? warningPillStyle : pillStyle}>{entry.sentiment}</span>
                      <span style={entry.resolved ? miniPillStyle : warningPillStyle}>{entry.resolved ? 'resolved' : 'open'}</span>
                      <span style={feedbackEscalation(entry) === 'urgent' ? warningPillStyle : miniPillStyle}>{feedbackEscalation(entry)}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>{entry.message}</div>
                  <div style={{ ...mutedStyle, marginTop: 8 }}><strong>Action hint:</strong> {feedbackActionHint(entry)}</div>
                  <div style={{ ...mutedStyle, marginTop: 8 }}>
                    {entry.reviewer} · {entry.source} · score {entry.score ?? 'n/a'} · {formatTimestamp(entry.createdAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Feedback summary</h2>
            <ul>
              <li>Total entries: {feedbackSummary.total}</li>
              <li>Average score: {feedbackSummary.averageScore ?? 'n/a'}</li>
              <li>Open items: {feedbackSummary.openCount}</li>
              <li>Resolved items: {feedbackSummary.resolvedCount}</li>
              <li>Latest capture: {formatTimestamp(feedbackSummary.latestAt ?? '')}</li>
              <li>Categories: UX {feedbackSummary.categories.ux}, bugs {feedbackSummary.categories.bug}, draft quality {feedbackSummary.categories.result_quality}</li>
            </ul>
          </div>

          <div>
            <h2>Operator prompts</h2>
            <ul>
              <li>Capture draft-quality feedback before toggling any send mode.</li>
              <li>Log bug feedback when CSV import, queue order, or notes look wrong.</li>
              <li>Use repeated low scores to decide which prompts or UI slices need the next fix.</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 24, gridTemplateColumns: '1.4fr 1fr' }}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>CSV import preview</h2>
          <p style={mutedStyle}>
            Operators can sanity-check bulk lead uploads before touching the database: required fields, duplicate emails, status normalization, and row-level validation stay visible.
          </p>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 16 }}>
            <MetricCard label="Valid rows" value={String(csvPreview.validRows.length)} helper="Rows ready for import" />
            <MetricCard label="Row issues" value={String(csvPreview.issues.length)} helper="Rows blocked before import" />
            <MetricCard label="Duplicates" value={String(csvPreview.duplicateEmails.length)} helper="Emails repeated in the file" />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #d8dee4' }}>
                  <th style={tableHeadStyle}>Row</th>
                  <th style={tableHeadStyle}>Lead</th>
                  <th style={tableHeadStyle}>Status</th>
                  <th style={tableHeadStyle}>Source</th>
                  <th style={tableHeadStyle}>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {csvPreview.validRows.map((row) => (
                  <tr key={`${row.rowNumber}-${row.email}`} style={{ borderBottom: '1px solid #f0f3f6' }}>
                    <td style={tableCellStyle}>{row.rowNumber}</td>
                    <td style={tableCellStyle}>
                      <strong>{row.name}</strong>
                      <div style={mutedStyle}>{row.email}</div>
                    </td>
                    <td style={tableCellStyle}>{row.status.toUpperCase()}</td>
                    <td style={tableCellStyle}>{row.source || '—'}</td>
                    <td style={tableCellStyle}>{row.warnings.join(' · ') || 'Ready to import'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...panelStyle, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginTop: 0 }}>Import checks</h2>
            <ul>
              <li>Required headers: <code>name</code>, <code>email</code></li>
              <li>Optional headers: <code>phone</code>, <code>source</code>, <code>status</code></li>
              <li>Missing headers: {csvPreview.missingHeaders.join(', ') || 'none'}</li>
              <li>Unknown headers: {csvPreview.unknownHeaders.join(', ') || 'none'}</li>
            </ul>
          </div>

          <div>
            <h2>Blocked rows</h2>
            <ul>
              {csvPreview.issues.map((issue) => (
                <li key={`${issue.rowNumber}-${issue.message}`}>Row {issue.rowNumber}: {issue.message}</li>
              ))}
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

const warningPillStyle: React.CSSProperties = {
  borderRadius: 999,
  background: '#fff8c5',
  color: '#9a6700',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
};

const miniPillStyle: React.CSSProperties = {
  borderRadius: 999,
  background: '#f6f8fa',
  color: '#57606a',
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 600,
};

const tableHeadStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  color: '#57606a',
};

const tableCellStyle: React.CSSProperties = {
  padding: '10px',
  verticalAlign: 'top',
};
