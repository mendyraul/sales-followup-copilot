"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type Account = {
  demo: boolean;
  user: { name: string; email: string } | null;
  memberships: { role: string; organization: { id: string; name: string } }[];
};
export function WorkspaceBar({ activeId }: { activeId: string }) {
  const router = useRouter();
  const [account, setAccount] = useState<Account>();
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccount)
      .catch(() => setError("Account settings unavailable."));
  }, []);
  if (!account || account.demo) return null;
  return (
    <div className="workspace-bar">
      <span>{account.user?.name}</span>
      <label>
        Workspace
        <select
          value={activeId}
          onChange={async (e) => {
            const r = await fetch("/api/auth/organization/set-active", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizationId: e.target.value }),
            });
            if (r.ok) location.reload();
            else setError("Workspace switch failed.");
          }}
        >
          {account.memberships.map((m) => (
            <option value={m.organization.id} key={m.organization.id}>
              {m.organization.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="quiet"
        onClick={async () => {
          await fetch("/api/auth/sign-out", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          router.replace("/login");
        }}
      >
        Sign out
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
