"use client";
import { HistoryList } from "./history-list";
import { useState } from "react";
export type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};
export type Notice = {
  id: string;
  title: string;
  readAt: string | null;
  createdAt: string;
  emailState: string;
  errorCode: string | null;
};
export type Preferences = {
  emailEnabled: boolean;
  digestEnabled: boolean;
  digestHour: number;
} | null;
type Mutate = (
  input: Record<string, unknown>,
  message: string,
  onSuccess?: () => void,
) => Promise<void>;
async function authPost(path: string, body: unknown) {
  const r = await fetch("/api/auth/organization/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.message || "Account action failed.");
  return b;
}
export function TeamSettings({
  workspace,
  settings,
  members,
  preferences,
  capabilities,
  worker,
  mutate,
  busy,
}: {
  workspace: { id: string; role: string; userId: string | null; demo: boolean };
  settings: { name: string; timezone: string };
  members: Member[];
  preferences: Preferences;
  capabilities: { smtp: boolean };
  worker: {
    online: boolean;
    seenAt: string;
    successAt: string | null;
    errorCode: string | null;
  } | null;
  mutate: Mutate;
  busy: boolean;
}) {
  const [error, setError] = useState("");
  const [invite, setInvite] = useState("");
  const [orgName, setOrgName] = useState("");
  return (
    <section className="workspace activity">
      <div className="panel">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h2>Settings & delivery</h2>
        <p>
          SMTP: {capabilities.smtp ? "Configured" : "Optional — not configured"}
          . Worker:{" "}
          {worker?.online
            ? "Online"
            : "Not reporting — start the worker for reminders"}
          .
        </p>
        {worker?.errorCode && (
          <p role="alert">Worker last error: {worker.errorCode}</p>
        )}
        {workspace.role === "owner" && (
          <form
            key={settings.name + settings.timezone}
            onSubmit={(e) => {
              e.preventDefault();
              void mutate(
                {
                  action: "saveWorkspaceSettings",
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                },
                "Workspace settings saved.",
              );
            }}
          >
            <label>
              Workspace name
              <input
                name="name"
                required
                maxLength={200}
                defaultValue={settings.name}
              />
            </label>
            <label>
              Workspace timezone
              <input
                name="timezone"
                required
                defaultValue={settings.timezone}
                list="timezones"
              />
            </label>
            <datalist id="timezones">
              {[
                "UTC",
                "America/New_York",
                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "Europe/London",
                "Europe/Paris",
                "Asia/Tokyo",
                "Australia/Sydney",
              ].map((z) => (
                <option key={z}>{z}</option>
              ))}
            </datalist>
            <button disabled={busy}>Save workspace settings</button>
          </form>
        )}
        {!workspace.demo && (
          <form
            className="inset"
            key={JSON.stringify(preferences)}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void mutate(
                {
                  action: "saveNotificationPreferences",
                  emailEnabled: f.get("emailEnabled") === "on",
                  digestEnabled: f.get("digestEnabled") === "on",
                  digestHour: Number(f.get("digestHour")),
                },
                "Reminder preferences saved.",
              );
            }}
          >
            <h3>Your reminders</h3>
            <label className="check">
              <input
                type="checkbox"
                name="emailEnabled"
                defaultChecked={preferences?.emailEnabled}
              />
              Email reminders to me
            </label>
            <label className="check">
              <input
                type="checkbox"
                name="digestEnabled"
                defaultChecked={preferences?.digestEnabled}
              />
              Daily digest
            </label>
            <label>
              Digest hour ({settings.timezone})
              <input
                type="number"
                min={0}
                max={23}
                name="digestHour"
                defaultValue={preferences?.digestHour ?? 9}
              />
            </label>
            <p className="muted">
              In-app reminders do not require SMTP. Email delivery requires the
              operator to configure SMTP. Retrying uncertain delivery can send a
              duplicate.
            </p>
            <button disabled={busy}>Save reminder preferences</button>
          </form>
        )}
      </div>
      <div className="panel">
        <h2>People & ownership</h2>
        {members.map((m) => (
          <article className="feedback" key={m.userId}>
            <strong>{m.user.name}</strong>
            <p>
              {m.user.email} · {m.role}
            </p>
            {workspace.role === "owner" && m.userId !== workspace.userId && (
              <div className="actions">
                <button
                  className="secondary"
                  onClick={async () => {
                    try {
                      await authPost("update-member-role", {
                        memberId: m.id,
                        role: m.role === "owner" ? "member" : "owner",
                        organizationId: workspace.id,
                      });
                      location.reload();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Make {m.role === "owner" ? "member" : "owner"}
                </button>
                <button
                  className="quiet danger"
                  onClick={async () => {
                    if (
                      confirm(
                        "Remove this member and leave their active work unassigned?",
                      )
                    )
                      try {
                        await authPost("remove-member", {
                          memberIdOrEmail: m.id,
                          organizationId: workspace.id,
                        });
                        location.reload();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                  }}
                >
                  Remove member
                </button>
              </div>
            )}
          </article>
        ))}
        {workspace.role === "owner" && !workspace.demo && (
          <form
            className="inset"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setError("");
                const fields = Object.fromEntries(
                  new FormData(e.currentTarget),
                );
                const b = await authPost("invite-member", {
                  ...fields,
                  organizationId: workspace.id,
                });
                setInvite(
                  location.origin +
                    "/accept-invitation?id=" +
                    encodeURIComponent(b.id),
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label>
              Invite email
              <input type="email" name="email" required />
            </label>
            <label>
              Invited role
              <select name="role">
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
            </label>
            <button>Invite member</button>
          </form>
        )}
        {invite && (
          <label>
            Private invitation link
            <input readOnly value={invite} />
            <p>
              Share only with the invited person. The link expires in seven
              days.
            </p>
          </label>
        )}
        {!workspace.demo && (
          <form
            className="inset"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const b = await authPost("create", {
                  name: orgName,
                  slug: crypto.randomUUID(),
                });
                await authPost("set-active", { organizationId: b.id });
                location.reload();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <label>
              New workspace name
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                maxLength={200}
              />
            </label>
            <button className="secondary">Create workspace</button>
          </form>
        )}
        {error && (
          <p className="danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
export function Notifications({
  notices,
  mutate,
  busy,
}: {
  notices: Notice[];
  mutate: Mutate;
  busy: boolean;
}) {
  return (
    <section className="panel">
      <h2>Your notifications</h2>
      {!notices.length && (
        <p className="muted">
          No notifications yet. Assigned due tasks appear here even while the
          app is closed.
        </p>
      )}
      <HistoryList
        items={notices}
        kind="notifications"
        render={(n) => (
          <article className="feedback" key={n.id}>
            <strong>{n.title}</strong>
            <p>
              {new Date(n.createdAt).toLocaleString()} · {n.emailState}
              {n.errorCode ? " · " + n.errorCode : ""}
            </p>
            <div className="actions">
              {!n.readAt && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() =>
                    void mutate(
                      { action: "markNotificationRead", notificationId: n.id },
                      "Notification marked read.",
                    )
                  }
                >
                  Mark read
                </button>
              )}
              {["FAILED", "UNCERTAIN"].includes(n.emailState) && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      confirm(
                        "Retry this email? An uncertain previous attempt may already have arrived.",
                      )
                    )
                      void mutate(
                        {
                          action: "retryNotificationEmail",
                          notificationId: n.id,
                        },
                        "Email queued for retry.",
                      );
                  }}
                >
                  Retry email
                </button>
              )}
            </div>
          </article>
        )}
      />
    </section>
  );
}
