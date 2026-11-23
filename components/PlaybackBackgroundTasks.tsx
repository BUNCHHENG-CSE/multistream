"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { useStreamStore } from "@/store/useStreamStore";

const LIVE_POLL_MS = 5 * 60 * 1000;
const SEEN_KEY = "tct_live_alert_seen";
const IDLE_MS = 3000;

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]") as string[]);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen).slice(-200)));
  } catch {
    // storage unavailable
  }
}

/** Sleep timer: when it runs out, mute and pause everything. */
function useSleepTimerEngine() {
  const endsAt = usePlaybackStore((s) => s.sleepTimerEndsAt);

  useEffect(() => {
    if (!endsAt) return;
    const fire = () => {
      useStreamStore.getState().muteAll();
      const playback = usePlaybackStore.getState();
      playback.triggerPauseAll();
      playback.setSleepTimer(null);
      toast.info("Sleep timer ended — all streams paused and muted");
    };
    const remaining = endsAt - Date.now();
    if (remaining <= 0) {
      fire();
      return;
    }
    const id = window.setTimeout(fire, remaining);
    return () => window.clearTimeout(id);
  }, [endsAt]);
}

/**
 * Live alerts: while the app is open (even minimized), check the user's YouTube
 * subscriptions every 5 minutes and notify when a channel goes live.
 * Uses the server's cached Subscriptions feed, so it costs no extra API quota most of the time.
 */
function useLiveAlerts() {
  const enabled = usePlaybackStore((s) => s.liveAlertsEnabled);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const seen = readSeen();
    // Very first run: only record what's already live, don't notify about it
    let skipNotify = seen.size === 0;

    const check = async () => {
      let region = "KH";
      try {
        region = localStorage.getItem("tct_yt_feed_region") || "KH";
      } catch {
        // ignore
      }
      try {
        const res = await fetch(
          `/api/youtube-feed?feed=subscriptions&region=${encodeURIComponent(region)}`
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          feed?: string;
          videos?: Array<{
            videoId: string;
            title: string;
            channelName: string;
            isLive: boolean;
          }>;
        };
        if (data.feed !== "subscriptions") return; // not synced / reconnect needed

        const live = (data.videos ?? []).filter((v) => v.isLive);
        const fresh = live.filter((v) => !seen.has(v.videoId));
        live.forEach((v) => seen.add(v.videoId));
        writeSeen(seen);

        if (skipNotify) {
          skipNotify = false;
          return;
        }

        for (const v of fresh.slice(0, 3)) {
          notifyLive(v.videoId, v.title, v.channelName);
        }
      } catch {
        // offline or server error — try again next interval
      }
    };

    void check();
    const id = window.setInterval(check, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);
}

/** "Remind me" for upcoming streams: alert ~1 minute before the scheduled start. */
function useStreamReminders() {
  const hasReminders = usePlaybackStore(
    (s) => Object.keys(s.reminders).length > 0
  );

  useEffect(() => {
    if (!hasReminders) return;
    const check = () => {
      const now = Date.now();
      const { reminders, removeReminder } = usePlaybackStore.getState();
      for (const r of Object.values(reminders)) {
        if (r.scheduledAt < now - 2 * 60 * 60 * 1000) {
          removeReminder(r.videoId); // long past — drop silently
        } else if (r.scheduledAt <= now + 60_000) {
          removeReminder(r.videoId);
          notifyLive(r.videoId, r.title, r.channelName || "A stream", "is starting");
        }
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [hasReminders]);
}

function notifyLive(
  videoId: string,
  title: string,
  channel: string,
  verb: "is live" | "is starting" = "is live"
) {
  const watch = () => {
    window.focus();
    const res = useStreamStore.getState().addStream(videoId, title);
    if (res.success) toast.success(`Added "${title}" to your grid`);
    else if (res.error) toast.info(res.error);
  };

  if (
    document.visibilityState === "hidden" &&
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    const n = new Notification(`${channel} ${verb}`, {
      body: title,
      icon: "/icons/icon-192.png",
      tag: `live-${videoId}`,
    });
    n.onclick = () => {
      watch();
      n.close();
    };
    return;
  }

  toast(`🔴 ${channel} ${verb}`, {
    description: title,
    duration: 15000,
    action: { label: "Watch", onClick: watch },
  });
}

/**
 * Fullscreen auto-hide: after 3s without mouse/keyboard activity on the page,
 * the top bar fades out (hover the top edge to bring it back).
 */
function useFullscreenIdle() {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const wake = () => {
      if (!document.fullscreenElement) return;
      root.dataset.idle = "false";
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        root.dataset.idle = "true";
      }, IDLE_MS);
    };

    const onFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      root.dataset.fullscreen = String(isFs);
      if (isFs) wake();
      else {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        delete root.dataset.idle;
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("mousemove", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("touchstart", wake, { passive: true });
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("touchstart", wake);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      delete root.dataset.fullscreen;
      delete root.dataset.idle;
    };
  }, []);
}

/** Mount once on the studio page. Renders nothing. */
export function PlaybackBackgroundTasks() {
  useSleepTimerEngine();
  useLiveAlerts();
  useStreamReminders();
  useFullscreenIdle();
  return null;
}
