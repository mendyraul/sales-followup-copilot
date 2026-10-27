"use client";
import { useState } from "react";
export type Profile = {
  version: number;
  tone: string;
  signoff: string;
  examples: string[];
  bannedPhrases: string[];
} | null;
export type InboxStatus = {
  id: string;
  email: string;
  state: string;
  lastSyncAt: string | null;
  errorCode: string | null;
} | null;
export type MailThread = {
  id: string;
  subject: string;
  lastSyncAt: string | null;
  messages: {
    id: string;
    subject: string;
    from: string;
    to: string;
    text: string;
    occurredAt: string;
    direction: string;
  }[];
};
type Mutate = (
  input: Record<string, unknown>,
  message: string,
  onSuccess?: () => void,
) => Promise<void>;
async function inbox(input: unknown) {
  const r = await fetch("/api/inbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || "Inbox action failed.");
  return b;
}
export function WritingSettings({
  profile,
  owner,
  busy,
  mutate,
}: {
  profile: Profile;
  owner: boolean;
  busy: boolean;
  mutate: Mutate;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">SOUND LIKE YOURSELF</p>
      <h2>Workspace writing voice</h2>
      <p className="muted">
        Templates work without a key. Approved examples guide an optional AI
        provider; only you decide what to send.
      </p>
      {owner ? (
        <form
          key={profile?.version ?? 0}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void mutate(
              {
                action: "saveWritingProfile",
                version: profile?.version ?? 0,
                tone: f.get("tone"),
                signoff: f.get("signoff"),
                examples: String(f.get("examples") || "")
                  .split(/\n---\n/)
                  .map((v) => v.trim())
                  .filter(Boolean),
                bannedPhrases: String(f.get("bannedPhrases") || "")
                  .split("\n")
                  .map((v) => v.trim())
                  .filter(Boolean),
              },
              "Writing profile saved.",
            );
          }}
        >
          <label>
            Preferred tone
            <select name="tone" defaultValue={profile?.tone || "friendly"}>
              {["friendly", "direct", "consultative"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Sign-off
            <textarea
              name="signoff"
              required
              maxLength={300}
              defaultValue={
                profile?.signoff || "Best,\nSales Follow-Up Copilot"
              }
            />
          </label>
          <label>
            Approved writing examples
            <textarea
              name="examples"
              defaultValue={profile?.examples.join("\n---\n") || ""}
              placeholder="Separate up to five examples with a line containing ---"
            />
          </label>
          <label>
            Phrases to avoid
            <textarea
              name="bannedPhrases"
              defaultValue={profile?.bannedPhrases.join("\n") || ""}
              placeholder="One phrase per line"
            />
          </label>
          <button disabled={busy}>Save writing profile</button>
        </form>
      ) : (
        <p>Ask a workspace owner to update the writing profile.</p>
      )}
    </section>
  );
}
export function InboxSettings({
  status,
  enabled,
  demo,
  onRefresh,
}: {
  status: InboxStatus;
  enabled: boolean;
  demo: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel">
      <h2>Optional Gmail connection</h2>
      <p>
        {status ? `${status.email} · ${status.state}` : "No inbox connected."}
      </p>
      {status?.lastSyncAt && (
        <p>Last sync: {new Date(status.lastSyncAt).toLocaleString()}</p>
      )}
      {status?.errorCode && <p role="alert">{status.errorCode}</p>}
      <p className="muted">
        Only conversations you attach are copied into the workspace. Attached
        copies are shared with its members. Gmail is read-only; messages are
        sent in your inbox.
      </p>
      {!enabled && (
        <p>
          Gmail is disabled until the operator configures an OAuth client and
          encryption key. All core follow-up tools still work.
        </p>
      )}
      <div className="actions">
        <button
          disabled={!enabled || demo || busy}
          onClick={async () => {
            setBusy(true);
            try {
              const b = await inbox({ action: "connect" });
              location.assign(b.url);
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
        >
          {status ? "Reconnect Gmail" : "Connect Gmail"}
        </button>
        {status && (
          <>
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await inbox({ action: "sync" });
                  await onRefresh();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Sync attached conversations
            </button>
            <button
              className="quiet danger"
              disabled={busy}
              onClick={async () => {
                if (
                  !confirm(
                    "Disconnect Gmail and remove its synced message copies? Existing notes and draft text are retained.",
                  )
                )
                  return;
                setBusy(true);
                try {
                  const b = await inbox({
                    action: "disconnect",
                    removeImported: true,
                  });
                  await onRefresh();
                  if (!b.revoked)
                    setError(
                      "Disconnected locally. Google could not be reached; review the app grant in your Google account.",
                    );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Disconnect & remove copies
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
    </section>
  );
}
export function LeadInbox({
  leadId,
  threads,
  connected,
  onRefresh,
}: {
  leadId: string;
  threads: MailThread[];
  connected: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [candidates, setCandidates] = useState<
    { id: string; subject: string; snippet: string }[]
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel">
      <h2>Linked conversations</h2>
      {connected && (
        <button
          className="secondary"
          disabled={busy}
          onClick={async () => {
            try {
              setError("");
              const b = await inbox({ action: "search", leadId });
              setCandidates(b.threads);
              if (!b.threads.length)
                setError("No matching Gmail conversations found.");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Find Gmail conversations
        </button>
      )}
      {candidates.map((t) => (
        <article className="inset" key={t.id}>
          <strong>{t.subject}</strong>
          <p>{t.snippet}</p>
          <button
            disabled={busy}
            onClick={async () => {
              if (
                !confirm(
                  "Share this conversation and its message text with every member of this workspace?",
                )
              )
                return;
              setBusy(true);
              try {
                await inbox({
                  action: "attach",
                  leadId,
                  threadId: t.id,
                  confirmShare: true,
                });
                await onRefresh();
                setCandidates([]);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Attach & share conversation
          </button>
        </article>
      ))}
      {!threads.length && (
        <p className="muted">
          No attached conversations. You can still capture context with notes.
        </p>
      )}
      {threads.map((t) => (
        <details className="inset" key={t.id}>
          <summary>{t.subject}</summary>
          {t.messages.map((m) => (
            <article className="feedback" key={m.id}>
              <strong>{m.subject}</strong>
              <p>
                {m.from} → {m.to} · {new Date(m.occurredAt).toLocaleString()}
              </p>
              <p className="prewrap">{m.text}</p>
            </article>
          ))}
        </details>
      ))}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function DraftSources({
  notes,
  threads,
  external,
}: {
  notes: { id: string; body: string }[];
  threads: MailThread[];
  external: boolean;
}) {
  return (
    <details className="inset">
      <summary>Choose draft context</summary>
      <p>
        Lead context is always included. Choose up to five notes and five
        messages. Only excerpts of the selected records are used.
      </p>
      {notes.slice(0, 20).map((n, i) => (
        <label className="check" key={n.id}>
          <input
            type="checkbox"
            name="noteIds"
            value={n.id}
            defaultChecked={i === 0}
          />{" "}
          {n.body.slice(0, 180)}
        </label>
      ))}
      {threads
        .flatMap((t) => t.messages)
        .map((m) => (
          <label className="check" key={m.id}>
            <input type="checkbox" name="messageIds" value={m.id} /> {m.subject}{" "}
            · {new Date(m.occurredAt).toLocaleDateString()}
          </label>
        ))}
      {external && (
        <label className="check">
          <input type="checkbox" name="confirmExternal" required /> Share the
          selected context and writing examples with the configured external AI
          provider for this draft.
        </label>
      )}
    </details>
  );
}
