"use client";
import { useState } from "react";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="auth-page">
      <section className="panel narrow">
        <p className="eyebrow">FOLLOW THROUGH</p>
        <h1>Welcome back.</h1>
        <p>
          Your private sales workspace. Ask an owner for an invitation if you do
          not have an account.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const values = Object.fromEntries(new FormData(e.currentTarget));
            try {
              const r = await fetch("/api/auth/sign-in/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });
              const b = await r.json();
              if (!r.ok) throw new Error(b.message || "Sign-in failed.");
              window.location.assign("/");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Sign-in failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
            />
          </label>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
          <button disabled={busy}>Sign in</button>
        </form>
        <p className="muted">
          Self-hosted administrators can create or recover an account with the
          owner CLI.
        </p>
      </section>
    </main>
  );
}
