"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStreamStore } from "@/store/useStreamStore";
import { cn } from "@/lib/utils";

/**
 * Pager for the 1x1 view: tap the arrows or swipe left/right on the strip to
 * rotate streams. (Swipes on the video itself go to YouTube's iframe, so the
 * gesture area is this strip.) Arrow keys ← / → work too when it's focused.
 */
export function StreamPager({ className }: { className?: string }) {
  const streams = useStreamStore((s) => s.streams);
  const cycleNextStream = useStreamStore((s) => s.cycleNextStream);
  const cyclePrevStream = useStreamStore((s) => s.cyclePrevStream);
  const touchStartX = useRef<number | null>(null);

  if (streams.length <= 1) return null;
  const current = streams[0];

  const onTouchEnd = (endX: number) => {
    if (touchStartX.current === null) return;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) cycleNextStream();
    else cyclePrevStream();
  };

  return (
    <div
      role="group"
      aria-label="Switch stream"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          cycleNextStream();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          cyclePrevStream();
        }
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => onTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
      className={cn(
        "mt-1.5 flex shrink-0 touch-pan-y select-none items-center gap-2 rounded-xl border border-zinc-200/90 bg-white/90 px-1.5 py-1 text-xs shadow-sm outline-none backdrop-blur-md focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-zinc-800/90 dark:bg-zinc-900/90",
        className
      )}
    >
      <button
        type="button"
        onClick={cyclePrevStream}
        aria-label="Previous stream"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center">
        <span className="max-w-full truncate font-medium text-zinc-900 dark:text-zinc-100">
          {current.label}
        </span>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Swipe or tap arrows · {streams.length} streams
        </span>
      </div>

      <button
        type="button"
        onClick={cycleNextStream}
        aria-label="Next stream"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
