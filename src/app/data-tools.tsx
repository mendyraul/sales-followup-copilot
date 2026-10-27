"use client";
import { useState } from "react";
type Fields = {
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  unsubscribed: boolean;
};
type Contact = Fields & { id: string; version: number };
type Mutate = (
  input: Record<string, unknown>,
  message: string,
  onSuccess?: () => void,
) => Promise<void>;
const keys = [
  "name",
  "email",
  "phone",
  "source",
  "status",
  "notes",
  "unsubscribed",
] as const;
async function post(url: string, input: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error || "Request failed.");
  return b;
}
function FieldChoices({
  source,
  target,
  onChange,
}: {
  source: Fields;
  target: Fields;
  onChange: (value: Fields) => void;
}) {
  const [choices, setChoices] = useState<
    Partial<Record<keyof Fields, "source" | "target">>
  >({});
  return (
    <div className="merge-fields">
      {keys.map((key) => (
        <label key={key}>
          {key}
          <select
            value={choices[key] || "target"}
            onChange={(e) => {
              const next = {
                ...choices,
                [key]: e.target.value as "source" | "target",
              };
              setChoices(next);
              const fields = Object.fromEntries(
                keys.map((k) => [
                  k,
                  next[k] === "source" ? source[k] : target[k],
                ]),
              ) as Fields;
              onChange(fields);
            }}
          >
            <option value="target">
              Keep existing: {String(target[key] ?? "empty").slice(0, 90)}
            </option>
            <option value="source">
              Use incoming: {String(source[key] ?? "empty").slice(0, 90)}
            </option>
          </select>
        </label>
      ))}
    </div>
  );
}
export function MergeContacts({
  lead,
  mutate,
  onMerged,
  busy,
}: {
  lead: Contact;
  mutate: Mutate;
  onMerged: (id: string) => void;
  busy: boolean;
}) {
  const [candidates, setCandidates] = useState<Contact[] | null>(null);
  const [targetId, setTargetId] = useState("");
  const [chosen, setChosen] = useState<Fields>();
  const [keepTask, setKeepTask] = useState("target");
  const [error, setError] = useState("");
  const target = candidates?.find((c) => c.id === targetId);
  return (
    <details className="inset">
      <summary>Review possible duplicates</summary>
      <button
        className="secondary"
        disabled={busy}
        onClick={async () => {
          try {
            const b = await post("/api/workspace", {
              action: "duplicateCandidates",
              leadId: lead.id,
            });
            setCandidates(b.candidates);
            setTargetId(b.candidates[0]?.id || "");
            setChosen(b.candidates[0]);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Find possible duplicates
      </button>
      {error && <p role="alert">{error}</p>}
      {candidates?.length === 0 && (
        <p>No matching names, emails or international phone numbers.</p>
      )}
      {!!candidates?.length && (
        <>
          <label>
            Surviving contact
            <select
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setChosen(candidates.find((c) => c.id === e.target.value));
              }}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.email || c.phone || c.id}
                </option>
              ))}
            </select>
          </label>
          {target && (
            <FieldChoices
              key={target.id}
              source={lead}
              target={target}
              onChange={setChosen}
            />
          )}
          <label>
            If both contacts have an open task
            <select
              value={keepTask}
              onChange={(e) => setKeepTask(e.target.value)}
            >
              <option value="target">Keep surviving contact's task</option>
              <option value="source">Keep incoming contact's task</option>
            </select>
          </label>
          <p>
            Notes, drafts, interaction history and feedback are retained.
            Opt-out is retained if either contact opted out. Old contact links
            resolve to the survivor.
          </p>
          <button
            className="danger secondary"
            disabled={busy || !target}
            onClick={() => {
              if (
                target &&
                chosen &&
                confirm("Merge these contacts? Review all field choices first.")
              )
                void mutate(
                  {
                    action: "mergeLeads",
                    sourceId: lead.id,
                    targetId: target.id,
                    sourceVersion: lead.version,
                    targetVersion: target.version,
                    fields: chosen,
                    keepTask,
                  },
                  "Contacts merged.",
                  () => onMerged(target.id),
                );
            }}
          >
            Confirm contact merge
          </button>
        </>
      )}
    </details>
  );
}
type Preview = {
  digest: string;
  rows: { row: { rowNumber: number }; fields: Fields; candidates: Contact[] }[];
};
export function ImportReview({
  csv,
  mutate,
  busy,
}: {
  csv: string;
  mutate: Mutate;
  busy: boolean;
}) {
  const [preview, setPreview] = useState<Preview>();
  const [error, setError] = useState("");
  const [decisions, setDecisions] = useState<
    Record<
      number,
      {
        action: string;
        targetId?: string;
        targetVersion?: number;
        fields?: Fields;
      }
    >
  >({});
  return (
    <div className="inset">
      <h3>Review existing-contact matches</h3>
      <button
        className="secondary"
        disabled={busy}
        onClick={async () => {
          try {
            setError("");
            setPreview(
              await post("/api/workspace", { action: "previewImport", csv }),
            );
            setDecisions({});
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        Review duplicate matches
      </button>
      {error && <p role="alert">{error}</p>}
      {preview?.rows.map(({ row, fields, candidates }) => {
        const decision = decisions[row.rowNumber];
        const target =
          candidates.find((c) => c.id === decision?.targetId) || candidates[0];
        return (
          <article className="inset" key={row.rowNumber}>
            <h4>
              Row {row.rowNumber}: {fields.name}
            </h4>
            <p>{candidates.length} possible matches</p>
            <label>
              Row decision
              <select
                value={decision?.action || (!candidates.length ? "create" : "")}
                onChange={(e) =>
                  setDecisions({
                    ...decisions,
                    [row.rowNumber]: {
                      action: e.target.value,
                      targetId: target?.id,
                      targetVersion: target?.version,
                      fields: target,
                    },
                  })
                }
              >
                <option value="">Choose a decision</option>
                <option value="create">Create separately</option>
                <option value="merge">Merge into existing</option>
                <option value="skip">Skip</option>
              </select>
            </label>
            {decision?.action === "merge" && target && (
              <>
                <label>
                  Existing contact
                  <select
                    value={decision.targetId || target.id}
                    onChange={(e) => {
                      const c = candidates.find(
                        (c) => c.id === e.target.value,
                      )!;
                      setDecisions({
                        ...decisions,
                        [row.rowNumber]: {
                          ...decision,
                          targetId: c.id,
                          targetVersion: c.version,
                          fields: c,
                        },
                      });
                    }}
                  >
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.email}
                      </option>
                    ))}
                  </select>
                </label>
                <FieldChoices
                  key={target.id}
                  source={fields}
                  target={target}
                  onChange={(value) =>
                    setDecisions({
                      ...decisions,
                      [row.rowNumber]: { ...decision, fields: value },
                    })
                  }
                />
              </>
            )}
          </article>
        );
      })}
      {preview && (
        <button
          disabled={
            busy ||
            preview.rows.some(
              (r) => r.candidates.length && !decisions[r.row.rowNumber]?.action,
            )
          }
          onClick={() =>
            void mutate(
              {
                action: "importCsv",
                csv,
                digest: preview.digest,
                decisions: preview.rows.map((r) => ({
                  rowNumber: r.row.rowNumber,
                  ...(decisions[r.row.rowNumber] || { action: "create" }),
                })),
              },
              "Reviewed CSV imported.",
              () => setPreview(undefined),
            )
          }
        >
          Apply reviewed import
        </button>
      )}
    </div>
  );
}
export function DataTools({ owner, demo }: { owner: boolean; demo: boolean }) {
  const [backup, setBackup] = useState<unknown>();
  const [preview, setPreview] = useState<{
    digest: string;
    summary: Record<string, unknown>;
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <section className="inset">
      <h3>Take your data with you</h3>
      <div className="actions">
        <a className="button-link" href="/api/exports?format=csv">
          Export contacts CSV
        </a>
        {owner && (
          <a className="button-link" href="/api/exports">
            Export complete workspace JSON
          </a>
        )}
      </div>
      {owner && !demo && (
        <>
          <h4>Restore into a new workspace</h4>
          <label>
            Workspace JSON backup
            <input
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                setPreview(undefined);
                setBackup(undefined);
                setError("");
                try {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 14000000)
                      throw new Error("Backup must be under 14 MB.");
                    setBackup(JSON.parse(await file.text()));
                  }
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          </label>
          <button
            className="secondary"
            disabled={!backup || busy}
            onClick={async () => {
              try {
                setError("");
                setPreview(
                  await post("/api/exports", { action: "preview", backup }),
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Preview restore
          </button>
          {preview && (
            <>
              <p>
                {Object.entries(preview.summary)
                  .map(([k, v]) => `${k}: ${String(v)}`)
                  .join(" · ")}
              </p>
              <p>
                This creates a separate workspace. Accounts and credentials are
                excluded; ownership must be assigned again.
              </p>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const b = await post("/api/exports", {
                      action: "restore",
                      backup,
                      digest: preview.digest,
                    });
                    await fetch("/api/auth/organization/set-active", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ organizationId: b.workspaceId }),
                    });
                    location.reload();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Restore new workspace
              </button>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
    </section>
  );
}
