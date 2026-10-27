"use client";
import { useState } from "react";
export default function AcceptInvitation() {
  const [error, setError] = useState("");
  return (
    <main className="auth-page">
      <section className="panel narrow">
        <h1>Join your workspace.</h1>
        <p>
          For a new account, use the email address invited by the owner. Already
          registered? Sign in first, then return to this link.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const data = Object.fromEntries(new FormData(e.currentTarget));
            const invitationId = new URLSearchParams(location.search).get("id");
            try {
              if (!invitationId) throw new Error("Invitation link is missing.");
              const signup = await fetch("/api/auth/sign-up/email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Invitation-ID": invitationId,
                },
                body: JSON.stringify(data),
              });
              if (!signup.ok) {
                const session = await fetch("/api/auth/get-session");
                if (!(await session.json()))
                  throw new Error(
                    "Sign in first, or check your invited email and password.",
                  );
              }
              const accepted = await fetch(
                "/api/auth/organization/accept-invitation",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ invitationId }),
                },
              );
              const b = await accepted.json();
              if (!accepted.ok)
                throw new Error(
                  b.message || "Invitation could not be accepted.",
                );
              location.assign("/");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Unable to join");
            }
          }}
        >
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </label>
          <button>Join workspace</button>
          {error && <p role="alert">{error}</p>}
        </form>
        <a href="/login">Sign in to an existing account</a>
      </section>
    </main>
  );
}
