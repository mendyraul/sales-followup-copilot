"use client";
import { useState } from "react";
export type Progress = {
  dismissed: boolean;
  contacts: number;
  scheduled: number;
  interactions: number;
  drafted: number;
};
export function Onboarding({
  progress,
  mutate,
  navigate,
}: {
  progress: Progress;
  mutate: (data: Record<string, unknown>, message: string) => Promise<void>;
  navigate: (tab: string) => void;
}) {
  if (progress.dismissed) return null;
  const steps = [
    {
      done: progress.contacts >= 5,
      label: "Add or import five contacts",
      tab: "import",
    },
    {
      done: progress.scheduled > 0,
      label: "Schedule a next action",
      tab: "queue",
    },
    {
      done: progress.interactions > 0,
      label: "Log a real interaction",
      tab: "queue",
    },
    {
      done: progress.drafted > 0,
      label: "Prepare and review a draft",
      tab: "queue",
    },
  ];
  return (
    <section className="onboarding">
      <p className="eyebrow">YOUR FIRST FIVE MINUTES</p>
      <h2>Make the next follow-up easy.</h2>
      <p>
        Name your workspace and choose its timezone in Settings, then try the
        core workflow. Gmail, SMTP and AI keys are optional.
      </p>
      <ol>
        {steps.map((s) => (
          <li key={s.label}>
            {s.done ? "✓ " : ""}
            <button className="quiet" onClick={() => navigate(s.tab)}>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
      <button
        className="secondary"
        onClick={() =>
          void mutate(
            { action: "dismissOnboarding" },
            "Getting-started guide hidden. You can reopen it in Settings.",
          )
        }
      >
        Hide getting-started guide
      </button>
    </section>
  );
}
export function MaintainerFeedback({
  version,
  mode,
}: {
  version: string;
  mode: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [include, setInclude] = useState(true);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const body =
    description + (include ? `\n\nApp version: ${version}\nMode: ${mode}` : "");
  const url =
    "https://github.com/mendyraul/sales-followup-copilot/issues/new?" +
    new URLSearchParams({ title, body });
  return (
    <section className="panel">
      <h2>Help improve Follow Through</h2>
      <p>
        Your workspace feedback stays in this instance. To share feedback with
        the project maintainer, preview it here and submit it yourself on
        GitHub. No contact records, notes or email content are attached
        automatically.
      </p>
      <label>
        Public feedback title
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setPreview(false);
          }}
          maxLength={160}
        />
      </label>
      <label>
        What should improve?
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setPreview(false);
          }}
          maxLength={3000}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={include}
          onChange={(e) => setInclude(e.target.checked)}
        />{" "}
        Include app version and installation mode
      </label>
      <button
        className="secondary"
        disabled={!title.trim() || !description.trim()}
        onClick={() => setPreview(true)}
      >
        Preview public feedback
      </button>
      {preview && (
        <div className="inset">
          <h3>{title}</h3>
          <p className="prewrap">{body}</p>
          <p>
            Remove client information before sharing. Nothing is submitted until
            you choose to post on GitHub.
          </p>
          <div className="actions">
            <a
              className="button-link"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub feedback form
            </a>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(title + "\n\n" + body);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy feedback"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
export function Usage({
  stats,
}: {
  stats: {
    overdue: number;
    completed14d: number;
    activeDays14d: number;
  } | null;
}) {
  return stats ? (
    <section className="panel">
      <h2>Is the workflow helping?</h2>
      <p>
        {stats.overdue} overdue next actions · {stats.completed14d} completed
        follow-ups in 14 days · {stats.activeDays14d} days with activity in 14
        days.
      </p>
      <p className="muted">
        These counts come from your workspace history and stay in this instance.
        No external analytics are enabled.
      </p>
    </section>
  ) : null;
}
