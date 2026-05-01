"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const r = await fetch("/blog/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(r.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="mt-24 bg-ink text-white rounded-lg p-10 md:p-14">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold leading-heading mb-3">
          The Wenest Journal, in your inbox.
        </h2>
        <p className="text-white/70 mb-6">
          One practical guide a fortnight. No hype, no fluff. Unsubscribe in two
          clicks.
        </p>
        {state === "ok" ? (
          <p className="text-accent font-medium">
            Thanks. We'll be in touch.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              className="flex-1 rounded-full px-5 py-3 text-ink bg-white outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="rounded-full bg-accent text-white px-6 py-3 font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {state === "loading" ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
        {state === "error" && (
          <p className="mt-3 text-sm text-red-300">
            Something went wrong. Try again in a moment.
          </p>
        )}
      </div>
    </section>
  );
}
