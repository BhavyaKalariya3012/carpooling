"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  role: "assistant",
  content:
    "Hi! I'm your CommuteShare assistant. Ask me how to offer or find a ride, book a seat, track a trip, or pay — or anything about your commute.",
};

export default function ChatWidget() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Only available to signed-in users (the API requires auth).
  if (loading || !user) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setSending(true);

    try {
      // Send recent turns (skip the static greeting) for context.
      const history = next.filter((m, i) => !(i === 0 && m === GREETING));
      const res = await apiFetch<{ reply: string }>("/api/v1/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The assistant is unavailable right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg transition hover:bg-emerald-700"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[30rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-zinc-100 bg-emerald-600 px-4 py-3 text-white">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-sm font-semibold leading-none">CommuteShare Assistant</p>
              <p className="mt-0.5 text-xs text-emerald-100">Powered by Gemini</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-600 px-3 py-2 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-800"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm text-zinc-400">
                  Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-center text-xs text-red-500">{error}</p>}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-zinc-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="min-w-0 flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
