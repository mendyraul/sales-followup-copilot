"use client";
import { useRef, useState } from "react";
export type Task = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  revision: number;
  needsReview: boolean;
  assigneeId: string | null;
};
export type Interaction = {
  id: string;
  outcome: string;
  occurredAt: string;
  note: string | null;
  provenance: string;
};
type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  unsubscribed: boolean;
  lastContactedAt: string | null;
  lastReplyAt: string | null;
  tasks: Task[];
  interactions: Interaction[];
};
type Mutate = (
  data: Record<string, unknown>,
  message: string,
  onSuccess?: () => void,
) => Promise<void>;
export function FollowupPanel({
  lead,
  timezone,
  busy,
  mutate,
}: {
  lead: Lead;
  timezone: string;
  busy: boolean;
  mutate: Mutate;
}) {
  const [logging, setLogging] = useState(false);
  const requestKey = useRef(crypto.randomUUID());
  const open = lead.tasks.find((t) => t.status === "OPEN");
  const blocked = lead.unsubscribed || ["WON", "LOST"].includes(lead.status);
  return (
    <section className="panel">
      <p className="eyebrow">A CLEAR NEXT STEP</p>
      <h2>Next action & contact history</h2>
      <p className="muted">
        Last outbound contact:{" "}
        {lead.lastContactedAt
          ? new Date(lead.lastContactedAt).toLocaleString()
          : "No recorded contact"}{" "}
        · Last reply:{" "}
        {lead.lastReplyAt
          ? new Date(lead.lastReplyAt).toLocaleString()
          : "No recorded reply"}
      </p>
      <div className="actions">
        <button className="secondary" onClick={() => setLogging(!logging)}>
          Log interaction
        </button>
        {lead.phone && (
          <a className="button-link" href={`tel:${lead.phone}`}>
            Call lead
          </a>
        )}
        {lead.email && (
          <a className="button-link" href={`mailto:${lead.email}`}>
            Open email
          </a>
        )}
      </div>
      {logging && (
        <form
          className="inset"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const values = Object.fromEntries(new FormData(form));
            void mutate(
              {
                action: "logInteraction",
                leadId: lead.id,
                requestKey: requestKey.current,
                ...values,
              },
              "Interaction saved.",
              () => {
                requestKey.current = crypto.randomUUID();
                form.reset();
                setLogging(false);
              },
            );
          }}
        >
          <label>
            Interaction outcome
            <select name="outcome">
              {["CALLED", "NO_ANSWER", "VOICEMAIL", "EMAILED", "REPLIED"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Interaction note
            <textarea name="note" maxLength={5000} />
          </label>
          <label>
            Next action after interaction
            <input name="nextAction" maxLength={300} />
          </label>
          <label>
            Next follow-up ({timezone})
            <input name="localDueAt" type="datetime-local" disabled={blocked} />
          </label>
          <p className="muted">
            Adding a date completes the prior task and schedules this next
            action. Leaving it blank retains the current task.
          </p>
          <button disabled={busy}>Save interaction</button>
        </form>
      )}
      {open ? (
        <article className="inset">
          <h3>{open.title}</h3>
          <p>
            {new Date(open.dueAt).toLocaleString(undefined, {
              timeZone: timezone,
            })}{" "}
            ({timezone})
            {open.needsReview ? " · Reply received — review this task" : ""}
          </p>
          <div className="actions">
            <button
              disabled={busy}
              onClick={() =>
                void mutate(
                  {
                    action: "completeTask",
                    leadId: lead.id,
                    taskId: open.id,
                    revision: open.revision,
                  },
                  "Task completed.",
                )
              }
            >
              Complete task
            </button>
            {[1, 7].map((days) => (
              <button
                className="secondary"
                disabled={busy}
                key={days}
                onClick={() =>
                  void mutate(
                    {
                      action: "rescheduleTask",
                      leadId: lead.id,
                      taskId: open.id,
                      revision: open.revision,
                      snoozeDays: days,
                    },
                    "Task rescheduled.",
                  )
                }
              >
                {days === 1 ? "Tomorrow" : "Next week"}
              </button>
            ))}
            <button
              className="quiet danger"
              disabled={busy}
              onClick={() =>
                void mutate(
                  {
                    action: "cancelTask",
                    leadId: lead.id,
                    taskId: open.id,
                    revision: open.revision,
                  },
                  "Task cancelled.",
                )
              }
            >
              Cancel task
            </button>
          </div>
        </article>
      ) : (
        <p className="muted">No next action scheduled.</p>
      )}
      {!blocked && (
        <form
          className="inset"
          key={open?.revision ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            void mutate(
              {
                action: open ? "rescheduleTask" : "scheduleTask",
                leadId: lead.id,
                taskId: open?.id,
                revision: open?.revision,
                ...Object.fromEntries(new FormData(form)),
              },
              open ? "Task rescheduled." : "Task scheduled.",
              () => form.reset(),
            );
          }}
        >
          <label>
            Next action title
            <input
              name="title"
              required
              maxLength={300}
              defaultValue={open?.title}
            />
          </label>
          <label>
            Due date ({timezone})
            <input name="localDueAt" type="datetime-local" required />
          </label>
          <button disabled={busy}>
            {open ? "Set new date" : "Schedule task"}
          </button>
        </form>
      )}
      <details>
        <summary>Interaction and task history</summary>
        <ul className="timeline">
          {lead.interactions.map((i) => (
            <li key={i.id}>
              <strong>{i.outcome.replaceAll("_", " ")}</strong> ·{" "}
              {new Date(i.occurredAt).toLocaleString()} · {i.provenance}
              {i.note && <p>{i.note}</p>}
            </li>
          ))}
          {lead.tasks
            .filter((t) => t.status !== "OPEN")
            .map((t) => (
              <li key={t.id}>
                {t.title} · {t.status} · {new Date(t.dueAt).toLocaleString()}
              </li>
            ))}
        </ul>
      </details>
    </section>
  );
}
