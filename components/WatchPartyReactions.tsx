"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Radio, Send, X } from "lucide-react";
import { useStreamStore } from "@/store/useStreamStore";
import {
  getPartyClientId,
  getPartyDisplayName,
  usePartyStore,
} from "@/lib/party-client";
import { cn } from "@/lib/utils";

const QUICK_EMOJIS = ["🔥", "🚀", "👏", "🤯", "❤️", "😂"] as const;

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function PartyChatPanel({ roomCode }: { roomCode: string }) {
  const messages = usePartyStore((s) => s.messages);
  const displayName = usePartyStore((s) => s.displayName);
  const setDisplayName = usePartyStore((s) => s.setDisplayName);
  const addMessages = usePartyStore((s) => s.addMessages);
  const setChatOpen = usePartyStore((s) => s.setChatOpen);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const myId = getPartyClientId();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim().slice(0, 300);
    if (!text) return;
    setDraft("");
    const sender = getPartyDisplayName();
    // Optimistic: show immediately, replaced by the server copy on next poll
    addMessages([
      {
        id: `local-${Date.now()}`,
        clientId: myId,
        sender,
        text,
        createdAt: Date.now(),
      },
    ]);
    fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CHAT", roomCode, clientId: myId, sender, text }),
    }).catch(() => {});
  };

  return (
    <div className="fixed bottom-24 left-4 z-40 flex h-80 w-72 flex-col overflow-hidden rounded-2xl border border-sky-500/30 bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-zinc-950/95">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
          <MessageCircle className="size-3.5" />
          {roomCode} chat
        </span>
        <button
          type="button"
          onClick={() => setChatOpen(false)}
          aria-label="Close party chat"
          className="rounded-full p-1 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <label className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-800">
        Name
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={getPartyDisplayName()}
          maxLength={32}
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:bg-zinc-100 dark:text-zinc-100 dark:focus:bg-zinc-900"
        />
      </label>

      <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2" aria-live="polite">
        {messages.length === 0 ? (
          <p className="pt-8 text-center text-xs text-zinc-500">
            No messages yet. Say hi to the room 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.clientId === myId;
            return (
              <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                <span className="px-1 text-[10px] text-zinc-500">
                  {mine ? "You" : m.sender} · {formatTime(m.createdAt)}
                </span>
                <span
                  className={cn(
                    "max-w-[85%] rounded-2xl px-2.5 py-1 text-xs break-words",
                    mine
                      ? "bg-sky-600 text-white"
                      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
                    m.id.startsWith("local-") && "opacity-70"
                  )}
                >
                  {m.text}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="flex items-center gap-1.5 border-t border-zinc-200 p-2 dark:border-zinc-800">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the room…"
          maxLength={300}
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-500 disabled:opacity-40"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
}

export function WatchPartyReactions() {
  const watchPartyCode = useStreamStore((s) => s.watchPartyCode);
  const floatingReactions = useStreamStore((s) => s.floatingReactions);
  const triggerFloatingReaction = useStreamStore(
    (s) => s.triggerFloatingReaction
  );
  const pruneFloatingReactions = useStreamStore(
    (s) => s.pruneFloatingReactions
  );
  const setWatchPartyCode = useStreamStore((s) => s.setWatchPartyCode);
  const isChatOpen = usePartyStore((s) => s.isChatOpen);
  const unread = usePartyStore((s) => s.unread);
  const setChatOpen = usePartyStore((s) => s.setChatOpen);

  useEffect(() => {
    if (floatingReactions.length === 0) return;
    const timer = window.setInterval(() => {
      pruneFloatingReactions();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [floatingReactions.length, pruneFloatingReactions]);

  const handleQuickEmoji = (emoji: string) => {
    triggerFloatingReaction(emoji, "You");
    if (!watchPartyCode) return;
    const sender = getPartyDisplayName();

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`tct-party-${watchPartyCode}`);
      channel.postMessage({ type: "REACTION", emoji, sender });
      channel.close();
    }

    fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REACTION",
        roomCode: watchPartyCode,
        // Our real id, so our own poll doesn't replay this reaction a second time
        clientId: getPartyClientId(),
        emoji,
        sender,
      }),
    }).catch(() => {});
  };

  return (
    <>
      {/* Floating Animated Emojis Layer */}
      {floatingReactions.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-40 h-64 overflow-hidden">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.leftPct}%` }}
              className="animate-float-reaction absolute bottom-0 flex flex-col items-center gap-0.5 select-none"
            >
              <span className="text-3xl drop-shadow-lg sm:text-4xl">
                {r.emoji}
              </span>
              {r.sender && (
                <span className="rounded-full bg-black/70 px-2 py-0.5 font-mono text-[9px] font-semibold text-white backdrop-blur-xs">
                  {r.sender}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {watchPartyCode && isChatOpen && <PartyChatPanel roomCode={watchPartyCode} />}

      {/* Compact Active Watch Party Reaction Dock */}
      {watchPartyCode && (
        <div className="fixed bottom-14 left-4 z-35 hidden items-center gap-1.5 rounded-full border border-sky-500/40 bg-white/90 px-2.5 py-1 shadow-lg backdrop-blur-xl sm:inline-flex dark:bg-zinc-950/90">
          <span className="inline-flex items-center gap-1 pr-1 font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">
            <Radio className="size-3 animate-pulse" />
            {watchPartyCode}
          </span>
          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="flex size-6 items-center justify-center rounded-full text-sm transition hover:scale-125 hover:bg-sky-500/15 active:scale-95"
              title={`Send ${emoji} to Party Room`}
            >
              {emoji}
            </button>
          ))}
          <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800" />
          <button
            type="button"
            onClick={() => setChatOpen(!isChatOpen)}
            aria-label={isChatOpen ? "Close party chat" : "Open party chat"}
            aria-pressed={isChatOpen}
            className={cn(
              "relative flex size-6 items-center justify-center rounded-full transition hover:bg-sky-500/15",
              isChatOpen ? "text-sky-600 dark:text-sky-400" : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <MessageCircle className="size-3.5" />
            {unread > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-0.5 font-mono text-[8px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setChatOpen(false);
              setWatchPartyCode(null);
            }}
            aria-label="Hide Watch Party bar"
            className="ml-0.5 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </>
  );
}
