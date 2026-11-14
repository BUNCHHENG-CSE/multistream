"use client";

import React, { useEffect } from "react";
import { Radio, X } from "lucide-react";
import { useStreamStore } from "@/store/useStreamStore";

const QUICK_EMOJIS = ["🔥", "🚀", "👏", "🤯", "❤️", "😂"] as const;

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

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`tct-party-${watchPartyCode}`);
      channel.postMessage({ type: "REACTION", emoji, sender: "Peer" });
      channel.close();
    }

    fetch("/api/party", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REACTION",
        roomCode: watchPartyCode,
        clientId: "quick-bar",
        emoji,
        sender: "Peer",
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
          <button
            type="button"
            onClick={() => setWatchPartyCode(null)}
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
