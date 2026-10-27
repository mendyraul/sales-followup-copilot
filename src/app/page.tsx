"use client";
import Link from "next/link";
import { FollowupPanel, type Task, type Interaction } from "./followup-panel";
import { dayWindow } from "../domain/dates";
import { MergeContacts, ImportReview, DataTools } from "./data-tools";
import {
  TeamSettings,
  Notifications,
  type Member,
  type Notice,
  type Preferences,
} from "./team-settings";
import {
  WritingSettings,
  InboxSettings,
  LeadInbox,
  DraftSources,
  type Profile,
  type InboxStatus,
  type MailThread,
} from "./inbox-writing";
import { WorkspaceBar } from "./workspace-bar";
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { allowedTransitions, type LeadStatus } from "../domain/lead";
import { buildQueue } from "../domain/queue";
import { parseLeadCsvPreview } from "../domain/csv-import";

type Draft = {
  id: string;
  subject: string;
  content: string;
  provider: string;
  approved: boolean;
  rejected: boolean;
  revision: number;
  warnings: string[];
  revisions: {
    id: string;
    revision: number;
    decision: string;
    subject: string;
    content: string;
  }[];
};
type Lead = {
  mailThreads: MailThread[];
  ownerId: string | null;
  version: number;
  lastContactedAt: string | null;
  lastReplyAt: string | null;
  tasks: Task[];
  interactions: Interaction[];
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
  status: string;
  unsubscribed: boolean;
  createdAt: string;
  updatedAt: string;
  drafts: Draft[];
  timelineNotes: { id: string; body: string; createdAt: string }[];
  events: {
    id: string;
    eventType: string;
    payload: string | null;
    createdAt: string;
  }[];
};
type Workspace = {
  writingProfile: Profile;
  inbox: InboxStatus;
  members: Member[];
  notifications: Notice[];
  preferences: Preferences;
  capabilities: { smtp: boolean; gmail: boolean };
  worker: {
    online: boolean;
    seenAt: string;
    successAt: string | null;
    errorCode: string | null;
  } | null;
  settings: { timezone: string; name: string };
  workspace: { id: string; role: string; userId: string | null; demo: boolean };
  leads: Lead[];
  audit: { id: string; action: string; createdAt: string; entityId: string }[];
  feedback: {
    id: string;
    rating: number;
    comments: string;
    createdAt: string;
  }[];
  mode: { sending: string; provider: string };
};
const statuses = ["NEW", "CONTACTED", "REPLIED", "HOT", "WON", "LOST"];
const when = (value: string) => new Date(value).toLocaleString();
function fields(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form));
}

export default function HomePage() {
  const [data, setData] = useState<Workspace>();
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [ownership, setOwnership] = useState("ALL");
  const [taskView, setTaskView] = useState("ALL");
  const [filter, setFilter] = useState("ALL");
  const [tab, setTab] = useState("queue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [csv, setCsv] = useState(
    "name,email,phone,source,status\nRiver Studio,hello@river.example,,Referral,new",
  );
  const refresh = useCallback(async () => {
    const response = await fetch("/api/workspace", { cache: "no-store" });
    const body = await response.json();
    if (response.status === 401) {
      globalThis.location.assign("/login");
      throw new Error("Sign in to continue.");
    }
    if (!response.ok)
      throw new Error(body.error || "Unable to load workspace.");
    setData(body);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/workspace", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Unable to load workspace.");
        return body;
      })
      .then(setData)
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  async function mutate(
    input: Record<string, unknown>,
    message: string,
    onSuccess?: () => void,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Change could not be saved.");
      await refresh();
      if (input.action === "createLead") {
        setSelected(body.id);
        setTab("queue");
      }
      setNotice(message);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Change could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  const queue = useMemo(
    () =>
      buildQueue(
        (data?.leads ?? [])
          .filter((l) => !l.unsubscribed)
          .map((l) => ({
            ...l,
            email: l.email ?? undefined,
            phone: l.phone ?? undefined,
            status: l.status.toLowerCase() as LeadStatus,
          })),
      ),
    [data],
  );
  const taskWindow = dayWindow(data?.settings.timezone || "UTC");
  const visible = (data?.leads ?? [])
    .filter(
      (l) =>
        ownership === "ALL" ||
        (ownership === "MINE" && l.ownerId === data?.workspace.userId) ||
        (ownership === "UNASSIGNED" && !l.ownerId),
    )
    .filter((l) => {
      const task = l.tasks.find((t) => t.status === "OPEN");
      return (
        taskView === "ALL" ||
        (taskView === "NONE" &&
          !task &&
          !l.unsubscribed &&
          !["WON", "LOST"].includes(l.status)) ||
        (taskView === "OVERDUE" && task && new Date(task.dueAt) < new Date()) ||
        (taskView === "TODAY" &&
          task &&
          new Date(task.dueAt) >= taskWindow.start &&
          new Date(task.dueAt) < taskWindow.end) ||
        (taskView === "UPCOMING" &&
          task &&
          new Date(task.dueAt) >= taskWindow.end)
      );
    })
    .filter(
      (l) =>
        (filter === "ALL" || l.status === filter) &&
        [l.name, l.email, l.source]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const sorted = [...visible].sort((a, b) => {
    const at = a.tasks.find((t) => t.status === "OPEN"),
      bt = b.tasks.find((t) => t.status === "OPEN");
    if (at && bt)
      return new Date(at.dueAt).getTime() - new Date(bt.dueAt).getTime();
    if (at || bt) return at ? -1 : 1;
    const order = (id: string) => {
      const n = queue.findIndex((q) => q.lead.id === id);
      return n < 0 ? 999 : n;
    };
    return order(a.id) - order(b.id);
  });
  const lead = data?.leads.find((l) => l.id === selected);
  const preview = useMemo(() => parseLeadCsvPreview(csv), [csv]);
  function submitLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    void mutate(
      { action: "createLead", ...fields(form) },
      "Lead created.",
      () => form.reset(),
    );
  }
  return (
    <main>
      {data && <WorkspaceBar activeId={data.workspace.id} />}
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-icon">↗</span> FOLLOW THROUGH
          <span className="edition">Sales workspace</span>
        </Link>
        <span className="mode">
          <span /> SENDING DISABLED
        </span>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">A LITTLE CONTEXT. A BETTER CONVERSATION.</p>
          <h1>Make the next move.</h1>
          <p className="subtitle">
            Your leads, their story, and a thoughtful follow-up. All in one
            place.
          </p>
        </div>
        <button
          onClick={() => {
            setTab("new");
            setSelected("");
          }}
        >
          + Add a lead
        </button>
      </section>
      {error && (
        <div className="alert error" role="alert">
          {error}{" "}
          <button
            className="quiet"
            onClick={() => {
              setError("");
              void refresh().catch((e: Error) => setError(e.message));
            }}
          >
            Retry
          </button>
        </div>
      )}
      {notice && (
        <div className="alert success" role="status">
          {notice}
        </div>
      )}
      {!data ? (
        <section className="panel empty">
          <h2>
            {error ? "Workspace needs attention" : "Opening your workspace…"}
          </h2>
          <p>
            {error
              ? "Start the database with npm run demo, then retry."
              : "Loading saved leads and activity."}
          </p>
        </section>
      ) : (
        <>
          <section className="metrics" aria-label="Workspace summary">
            <Metric label="Total leads" value={data.leads.length} />
            <Metric label="Need a follow-up" value={queue.length} />
            <Metric
              label="Hot opportunities"
              value={
                data.leads.filter((l) => l.status === "HOT" && !l.unsubscribed)
                  .length
              }
            />
            <Metric
              label="Pending drafts"
              value={
                data.leads
                  .flatMap((l) => l.drafts)
                  .filter((d) => !d.approved && !d.rejected).length
              }
            />
          </section>
          <nav className="tabs" aria-label="Workspace">
            <button
              className={tab === "queue" ? "active" : ""}
              onClick={() => setTab("queue")}
            >
              Lead workspace
            </button>
            <button
              className={tab === "import" ? "active" : ""}
              onClick={() => setTab("import")}
            >
              Import CSV
            </button>
            <button
              className={tab === "activity" ? "active" : ""}
              onClick={() => setTab("activity")}
            >
              Activity & feedback
            </button>
            <button
              className={tab === "notifications" ? "active" : ""}
              onClick={() => setTab("notifications")}
            >
              Notifications (
              {data.notifications.filter((n) => !n.readAt).length})
            </button>
            <button
              className={tab === "settings" ? "active" : ""}
              onClick={() => setTab("settings")}
            >
              Settings & team
            </button>
          </nav>
          {tab === "settings" && (
            <div className="detail">
              <TeamSettings
                workspace={data.workspace}
                settings={data.settings}
                members={data.members}
                preferences={data.preferences}
                capabilities={data.capabilities}
                worker={data.worker}
                mutate={mutate}
                busy={busy}
              />
              <WritingSettings
                profile={data.writingProfile}
                owner={data.workspace.role === "owner"}
                mutate={mutate}
                busy={busy}
              />
              <InboxSettings
                status={data.inbox}
                enabled={data.capabilities.gmail}
                demo={data.workspace.demo}
                onRefresh={refresh}
              />
            </div>
          )}
          {tab === "notifications" && (
            <Notifications
              notices={data.notifications}
              mutate={mutate}
              busy={busy}
            />
          )}
          {tab === "new" && (
            <section className="panel narrow">
              <p className="eyebrow">GROW YOUR PIPELINE</p>
              <h2>Add a lead</h2>
              <form onSubmit={submitLead}>
                <LeadFields />
                <button disabled={busy}>Create lead</button>
              </form>
            </section>
          )}
          {tab === "queue" && (
            <section className="workspace">
              <aside className="panel lead-list">
                <div className="panel-heading">
                  <h2>Your pipeline</h2>
                  <span className="count">{visible.length}</span>
                </div>
                <label>
                  Search leads
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, email, or source"
                  />
                </label>
                <label>
                  Status filter
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="ALL">All statuses</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Owner filter
                  <select
                    value={ownership}
                    onChange={(e) => setOwnership(e.target.value)}
                  >
                    <option value="ALL">Team</option>
                    <option value="MINE">Mine</option>
                    <option value="UNASSIGNED">Unassigned</option>
                  </select>
                </label>
                <label>
                  Follow-up view
                  <select
                    value={taskView}
                    onChange={(e) => setTaskView(e.target.value)}
                  >
                    <option value="ALL">All leads</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="TODAY">Today</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="NONE">No next action</option>
                  </select>
                </label>
                <div className="lead-items">
                  {sorted.length === 0 && (
                    <p className="muted">
                      No leads match. Add a lead or adjust the filters.
                    </p>
                  )}
                  {sorted.map((l) => {
                    const item = queue.find((q) => q.lead.id === l.id);
                    return (
                      <button
                        key={l.id}
                        className={`lead-card ${selected === l.id ? "selected" : ""}`}
                        onClick={() => setSelected(l.id)}
                      >
                        <div>
                          <span className="avatar">
                            {l.name.slice(0, 2).toUpperCase()}
                          </span>
                          <strong>{l.name}</strong>
                        </div>
                        <span className={`badge ${l.status.toLowerCase()}`}>
                          {l.status}
                        </span>
                        <p>
                          {l.unsubscribed
                            ? "Opted out · follow-up paused"
                            : item?.nextAction.label ||
                              "Closed · no follow-up needed"}
                        </p>
                        {item && (
                          <small>
                            {item.priority.toUpperCase()} PRIORITY ·{" "}
                            {l.lastContactedAt
                              ? `${Math.floor(item.ageHours)}h since outbound contact`
                              : "No recorded outbound contact"}
                            {item.ageHours >= 48 ? " · STALE" : ""}
                          </small>
                        )}
                      </button>
                    );
                  })}
                </div>
              </aside>
              <div className="detail">
                {!lead ? (
                  <section className="panel empty">
                    <span className="empty-icon">↗</span>
                    <h2>Every good follow-up starts here.</h2>
                    <p>
                      Select a lead to see their context, add a note,
                      <br />
                      and prepare the next conversation.
                    </p>
                    <button className="secondary" onClick={() => setTab("new")}>
                      Add your first lead
                    </button>
                  </section>
                ) : (
                  <>
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <p className="eyebrow">LEAD DETAILS</p>
                          <h2>{lead.name}</h2>
                        </div>
                        <span className={`badge ${lead.status.toLowerCase()}`}>
                          {lead.status}
                        </span>
                      </div>
                      <form
                        key={`${lead.id}-${lead.updatedAt}`}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const values = fields(e.currentTarget);
                          void mutate(
                            {
                              action: "updateLead",
                              leadId: lead.id,
                              ...values,
                              version: lead.version,
                              unsubscribed: values.unsubscribed === "on",
                            },
                            "Lead updated.",
                          );
                        }}
                      >
                        <LeadFields lead={lead} />
                        <label>
                          Lead owner
                          <select
                            value={lead.ownerId || ""}
                            onChange={(e) =>
                              void mutate(
                                {
                                  action: "assignLead",
                                  leadId: lead.id,
                                  version: lead.version,
                                  ownerId: e.target.value,
                                },
                                "Lead reassigned.",
                              )
                            }
                          >
                            <option value="">Unassigned</option>
                            {data.members.map((m) => (
                              <option key={m.userId} value={m.userId}>
                                {m.user.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="check">
                          <input
                            name="unsubscribed"
                            type="checkbox"
                            defaultChecked={lead.unsubscribed}
                          />{" "}
                          Opted out of follow-up
                        </label>
                        <div className="actions">
                          <button disabled={busy}>Save lead</button>
                          <button
                            disabled={busy}
                            type="button"
                            className="danger quiet"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete ${lead.name} and their notes and drafts? The audit record will remain.`,
                                )
                              )
                                void mutate(
                                  {
                                    action: "deleteLead",
                                    leadId: lead.id,
                                    version: lead.version,
                                  },
                                  "Lead deleted.",
                                  () => setSelected(""),
                                );
                            }}
                          >
                            Delete lead
                          </button>
                        </div>
                      </form>
                    </section>
                    <MergeContacts
                      lead={lead}
                      mutate={mutate}
                      onMerged={setSelected}
                      busy={busy}
                    />
                    <FollowupPanel
                      lead={lead}
                      timezone={data.settings.timezone}
                      busy={busy}
                      mutate={mutate}
                    />
                    <LeadInbox
                      key={lead.id}
                      leadId={lead.id}
                      threads={lead.mailThreads}
                      connected={!!data.inbox}
                      onRefresh={refresh}
                    />
                    <section className="panel">
                      <p className="eyebrow">THE NEXT CONVERSATION</p>
                      <h2>Follow-up drafts</h2>
                      <p className="muted">
                        Provider:{" "}
                        {data.mode.provider === "mock"
                          ? "Local template"
                          : data.mode.provider}
                        . Every draft needs your review. Approval saves a
                        decision; sending is disabled.
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void mutate(
                            {
                              action: "generateDraft",
                              leadId: lead.id,
                              ...fields(e.currentTarget),
                              noteIds: new FormData(e.currentTarget).getAll(
                                "noteIds",
                              ),
                              messageIds: new FormData(e.currentTarget).getAll(
                                "messageIds",
                              ),
                              confirmExternal:
                                new FormData(e.currentTarget).get(
                                  "confirmExternal",
                                ) === "on",
                            },
                            "Draft generated. Review before using.",
                          );
                        }}
                      >
                        <label>
                          Desired next step
                          <input
                            name="objective"
                            maxLength={500}
                            placeholder="e.g. Book a 15-minute discovery call"
                          />
                        </label>
                        <button
                          disabled={
                            busy ||
                            lead.unsubscribed ||
                            ["WON", "LOST"].includes(lead.status)
                          }
                        >
                          Generate draft
                        </button>
                        <DraftSources
                          key={lead.id}
                          notes={lead.timelineNotes}
                          threads={lead.mailThreads}
                          external={data.mode.provider === "openai"}
                        />
                      </form>
                      {lead.drafts.map((d) => (
                        <DraftEditor
                          key={`${d.id}-${d.revision}`}
                          draft={d}
                          blocked={
                            lead.unsubscribed ||
                            ["WON", "LOST"].includes(lead.status)
                          }
                          busy={busy}
                          review={(values, decision) =>
                            void mutate(
                              {
                                action: "reviewDraft",
                                leadId: lead.id,
                                draftId: d.id,
                                revision: d.revision,
                                ...values,
                                decision,
                              },
                              `Draft ${decision}. Sending remains disabled.`,
                            )
                          }
                        />
                      ))}
                    </section>
                    <section className="panel">
                      <h2>Notes & timeline</h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.currentTarget;
                          void mutate(
                            {
                              action: "addNote",
                              leadId: lead.id,
                              ...fields(form),
                            },
                            "Note saved.",
                            () => form.reset(),
                          );
                        }}
                      >
                        <label>
                          Add a note
                          <textarea
                            name="body"
                            required
                            maxLength={5000}
                            placeholder="What matters to this lead?"
                          />
                        </label>
                        <button disabled={busy}>Save note</button>
                      </form>
                      <ul className="timeline">
                        {lead.timelineNotes.map((n) => (
                          <li key={n.id}>
                            <span className="badge">NOTE</span>
                            <p className="prewrap">{n.body}</p>
                            <small>{when(n.createdAt)}</small>
                          </li>
                        ))}
                        {lead.events.map((e) => (
                          <li key={e.id}>
                            <strong>{e.eventType.replaceAll("_", " ")}</strong>
                            <p className="muted">{e.payload}</p>
                            <small>{when(e.createdAt)}</small>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}
              </div>
            </section>
          )}
          {tab === "import" && (
            <section className="panel narrow">
              <p className="eyebrow">BRING YOUR CONTACTS</p>
              <h2>Import leads from CSV</h2>
              <p className="muted">
                Required: name, email. Optional: phone, source, status. Import
                is atomic; existing emails or names cause a conflict. Maximum
                200 rows.
              </p>
              <label>
                CSV content
                <textarea
                  className="csv"
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                />
              </label>
              <p>
                {preview.validRows.length} valid rows · {preview.issues.length}{" "}
                errors · {preview.duplicateEmails.length} duplicate emails
              </p>
              {[
                ...preview.issues.map(
                  (i) => `Row ${i.rowNumber}: ${i.message}`,
                ),
                ...preview.missingHeaders.map((h) => `Missing header: ${h}`),
                ...preview.unknownHeaders.map((h) => `Unknown header: ${h}`),
                ...preview.duplicateEmails.map((h) => `Duplicate email: ${h}`),
              ].map((issue, i) => (
                <p className="danger" key={i}>
                  {issue}
                </p>
              ))}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.validRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td>{r.email}</td>
                        <td>{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                disabled={
                  busy ||
                  !preview.validRows.length ||
                  preview.issues.length > 0 ||
                  preview.duplicateEmails.length > 0 ||
                  preview.missingHeaders.length > 0 ||
                  preview.unknownHeaders.length > 0
                }
                onClick={() =>
                  void mutate(
                    { action: "importCsv", csv },
                    "CSV imported. Open the lead workspace to review.",
                  )
                }
              >
                Import {preview.validRows.length} leads
              </button>
              <ImportReview key={csv} csv={csv} mutate={mutate} busy={busy} />
              <DataTools
                owner={data.workspace.role === "owner"}
                demo={data.workspace.demo}
              />
            </section>
          )}
          {tab === "activity" && (
            <section className="workspace activity">
              <div className="panel">
                <p className="eyebrow">A CLEAR RECORD</p>
                <h2>Audit log</h2>
                <p className="muted">
                  Most recent 100 saved changes. Deletion records remain after a
                  lead is removed.
                </p>
                <ul className="timeline">
                  {data.audit.length === 0 && <li>No activity yet.</li>}
                  {data.audit.map((a) => (
                    <li key={a.id}>
                      <strong>{a.action}</strong>
                      <p className="muted">{a.entityId}</p>
                      <small>{when(a.createdAt)}</small>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel">
                <h2>Share feedback</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const values = fields(form);
                    void mutate(
                      {
                        action: "feedback",
                        ...values,
                        rating: Number(values.rating),
                      },
                      "Feedback saved. Thank you.",
                      () => form.reset(),
                    );
                  }}
                >
                  <label>
                    Related lead
                    <select name="leadId">
                      <option value="">General feedback</option>
                      {data.leads.map((l) => (
                        <option value={l.id} key={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Rating
                    <select name="rating" defaultValue="5">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <input
                      name="category"
                      maxLength={80}
                      placeholder="Workflow, draft quality, usability…"
                    />
                  </label>
                  <label>
                    Feedback
                    <textarea name="comments" required maxLength={3000} />
                  </label>
                  <button disabled={busy}>Save feedback</button>
                </form>
                <h3>Recent feedback</h3>
                {data.feedback.map((f) => (
                  <article className="feedback" key={f.id}>
                    <strong>{f.rating}/5</strong>
                    <p className="prewrap">{f.comments}</p>
                    <small>{when(f.createdAt)}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
          <footer>
            <span>FOLLOW THROUGH / LOCAL WORKSPACE</span>
            <span>
              Saved in Postgres · Fictional seed contacts · No outbound delivery
            </span>
          </footer>
        </>
      )}
    </main>
  );
}
function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value.toString().padStart(2, "0")}</strong>
    </div>
  );
}
function LeadFields({ lead }: { lead?: Lead }) {
  const choices = lead
    ? [
        lead.status,
        ...allowedTransitions[lead.status.toLowerCase() as LeadStatus].map(
          (s) => s.toUpperCase(),
        ),
      ]
    : statuses;
  return (
    <>
      <div className="form-grid">
        <label>
          Name
          <input
            name="name"
            required
            maxLength={200}
            defaultValue={lead?.name}
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            maxLength={254}
            defaultValue={lead?.email ?? ""}
          />
        </label>
        <label>
          Phone
          <input name="phone" maxLength={80} defaultValue={lead?.phone ?? ""} />
        </label>
        <label>
          Source
          <input
            name="source"
            maxLength={200}
            defaultValue={lead?.source ?? ""}
          />
        </label>
      </div>
      <label>
        Status
        <select name="status" defaultValue={lead?.status ?? "NEW"}>
          {choices.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        Lead context
        <textarea
          name="notes"
          maxLength={5000}
          defaultValue={lead?.notes ?? ""}
        />
      </label>
    </>
  );
}
function DraftEditor({
  draft,
  blocked,
  busy,
  review,
}: {
  draft: Draft;
  blocked: boolean;
  busy: boolean;
  review: (
    values: Record<string, FormDataEntryValue>,
    decision: string,
  ) => void;
}) {
  return (
    <article className="draft">
      <div className="panel-heading">
        <h3>Draft · revision {draft.revision}</h3>
        <span className="badge">
          {draft.approved
            ? "APPROVED"
            : draft.rejected
              ? "REJECTED"
              : "NEEDS REVIEW"}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          review(fields(e.currentTarget), "edited");
        }}
      >
        <label>
          Subject
          <input
            name="subject"
            required
            maxLength={300}
            defaultValue={draft.subject}
          />
        </label>
        <label>
          Draft body
          <textarea
            name="content"
            className="draft-body"
            required
            maxLength={15000}
            defaultValue={draft.content}
          />
        </label>
        <div className="actions">
          <button disabled={busy} className="secondary">
            Save revision
          </button>
          <button
            disabled={busy || blocked}
            type="button"
            onClick={(e) => {
              const form = e.currentTarget.closest("form")!;
              if (form.reportValidity()) review(fields(form), "approved");
            }}
          >
            Approve draft
          </button>
          <button
            disabled={busy}
            className="quiet danger"
            type="button"
            onClick={(e) => {
              const form = e.currentTarget.closest("form")!;
              if (form.reportValidity()) review(fields(form), "rejected");
            }}
          >
            Reject draft
          </button>
        </div>
      </form>
      <details>
        <summary>Review notes & revision history</summary>
        <ul>
          {(draft.warnings ?? []).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        {draft.revisions.map((r) => (
          <div key={r.id}>
            <h4>
              Revision {r.revision} · {r.decision}
            </h4>
            <strong>{r.subject}</strong>
            <p className="prewrap">{r.content}</p>
          </div>
        ))}
      </details>
    </article>
  );
}
