"use client";

import { useState } from "react";
import { MatchResult } from "@/lib/types";

const SUGGESTIONS = [
  "Why wasn't Wakad picked?",
  "Which is cheapest?",
  "What if the gym limit were 6 km?",
];

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function Chatbot({ results }: { results: MatchResult }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, results }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer || "Sorry, I couldn't answer that." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Something went wrong reaching the assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="font-semibold">Ask about these results</h3>

      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs hover:bg-accent-soft"
          >
            {s}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-surface-muted ml-8"
                  : "bg-accent-soft text-accent-strong mr-8"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong mr-8">
              Thinking…
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
