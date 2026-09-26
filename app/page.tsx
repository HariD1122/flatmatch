"use client";

import { useState } from "react";
import { DEFAULT_SETTINGS, MatchResult, MatchSettings } from "@/lib/types";
import FlatCard from "@/components/FlatCard";
import AdjustPanel from "@/components/AdjustPanel";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showNotChosen, setShowNotChosen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMatch() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data: MatchResult = await res.json();
      setResults(data);
    } catch {
      setError("Couldn't load results. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const checkedAt = results
    ? new Date(results.fetchedAt).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex-1 bg-background">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="text-center">
          <div className="text-3xl font-bold text-accent-strong">🏠 FlatMatch</div>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Find the best flat for all three of you
          </h1>
          <p className="mt-2 text-foreground-muted">
            Reads the latest House Hunt form responses and ranks the top addresses.
          </p>
        </header>

        <section className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            🛗 Lift or ground floor
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            🏢 Hinjewadi ≤ {settings.maxDistHinjewadi} km
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            🏋️ Gym ≤ {settings.maxDistGym} km
          </span>
          <button
            onClick={() => setShowAdjust((v) => !v)}
            className="text-accent underline underline-offset-2"
          >
            Adjust
          </button>
        </section>

        {showAdjust && (
          <div className="mx-auto mt-2 max-w-md">
            <AdjustPanel settings={settings} onChange={setSettings} />
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={runMatch}
            disabled={loading}
            className="rounded-full bg-accent px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-accent-strong disabled:opacity-60"
          >
            {loading ? "Reading responses…" : results ? "↻ Refresh best match" : "Show best match"}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-danger">{error}</p>
        )}

        {results && (
          <>
            <p className="mt-4 text-center text-xs text-foreground-muted">
              {results.source === "sheet" ? "Live from Google Sheet" : "Sample data"} · {results.totalResponses}{" "}
              responses read · {results.qualifyingCount} meet every must-have · checked at {checkedAt}
            </p>
            {results.note && (
              <p className="mt-1 text-center text-xs text-foreground-muted">{results.note}</p>
            )}

            {results.top.length > 0 ? (
              <div className="mt-6 space-y-4">
                {results.top.map((flat) => (
                  <FlatCard key={flat.address} flat={flat} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-center text-sm">
                <p>No flats meet every must-have requirement yet.</p>
                {results.relaxHint && <p className="mt-2 text-accent-strong">{results.relaxHint}</p>}
              </div>
            )}

            {results.nearMisses.length > 0 && (
              <div className="mt-6 rounded-xl border border-gold/40 bg-surface p-4 text-sm">
                <h3 className="font-semibold">Near misses (break exactly one rule)</h3>
                <ul className="mt-2 space-y-1">
                  {results.nearMisses.map((n) => (
                    <li key={n.address}>
                      <span className="font-medium">{n.address}</span> (found by {n.foundBy}) —{" "}
                      {n.brokenRule}
                    </li>
                  ))}
                </ul>
                {results.relaxHint && (
                  <p className="mt-2 text-accent-strong">{results.relaxHint}</p>
                )}
              </div>
            )}

            {Object.keys(results.reasonsBy).length > 0 && (
              <div className="mt-6 rounded-xl border border-danger/30 bg-surface p-4 text-sm">
                <h3 className="font-semibold">Needs checking</h3>
                {Object.entries(results.reasonsBy).map(([name, issues]) => (
                  <div key={name} className="mt-2">
                    <span className="font-medium">{name}: </span>
                    <ul className="ml-4 list-disc">
                      {issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {results.notChosen.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowNotChosen((v) => !v)}
                  className="text-sm text-accent underline underline-offset-2"
                >
                  {showNotChosen ? "Hide" : "Why the other addresses weren't picked"}
                </button>
                {showNotChosen && (
                  <ul className="mt-2 space-y-1 rounded-xl border border-border bg-surface p-4 text-sm">
                    {results.notChosen.map((n) => (
                      <li key={n.address}>
                        <span className="font-medium">{n.address}</span> (found by {n.foundBy}) —{" "}
                        {n.why}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-6">
              <Chatbot results={results} />
            </div>
          </>
        )}

        <footer className="mt-12 text-center text-xs text-foreground-muted">
          These are options to talk through together. The final call is yours.
        </footer>
      </main>
    </div>
  );
}
