"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell, BellOff, Moon, Radio, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { cn } from "@/lib/utils";

const SLEEP_OPTIONS = [0, 15, 30, 45, 60, 90, 120];

const TICK_MS = 15_000;
const subscribeTick = (onChange: () => void) => {
  const id = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(id);
};
// Snapshot is stable within each 15s window; 0 on the server (no clock during prerender)
const getTickSnapshot = () => Math.floor(Date.now() / TICK_MS) * TICK_MS;
const getServerTickSnapshot = () => 0;

/** Minutes left on the sleep timer (client-only clock, refreshed every 15s). */
function useMinutesLeft(endsAt: number | null): number | null {
  const now = useSyncExternalStore(
    subscribeTick,
    getTickSnapshot,
    getServerTickSnapshot
  );
  if (!endsAt || now === 0) return null;
  return Math.max(1, Math.ceil((endsAt - now) / 60_000));
}

/** Navbar menu: sleep timer + playback automation (auto-switch, live alerts). */
export function PlaybackMenu() {
  const sleepTimerEndsAt = usePlaybackStore((s) => s.sleepTimerEndsAt);
  const sleepTimerMinutes = usePlaybackStore((s) => s.sleepTimerMinutes);
  const setSleepTimer = usePlaybackStore((s) => s.setSleepTimer);
  const autoReplaceEnded = usePlaybackStore((s) => s.autoReplaceEnded);
  const setAutoReplaceEnded = usePlaybackStore((s) => s.setAutoReplaceEnded);
  const liveAlertsEnabled = usePlaybackStore((s) => s.liveAlertsEnabled);
  const setLiveAlertsEnabled = usePlaybackStore((s) => s.setLiveAlertsEnabled);
  const minutesLeft = useMinutesLeft(sleepTimerEndsAt);
  const [open, setOpen] = useState(false);

  const handleSleep = (minutes: number) => {
    setSleepTimer(minutes || null);
    toast.info(
      minutes
        ? `Sleep timer: streams will pause in ${minutes} min`
        : "Sleep timer off"
    );
  };

  const handleToggleLiveAlerts = async () => {
    if (liveAlertsEnabled) {
      setLiveAlertsEnabled(false);
      toast.info("Live alerts off");
      return;
    }
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    setLiveAlertsEnabled(true);
    const canNotify =
      typeof Notification !== "undefined" && Notification.permission === "granted";
    toast.success("Live alerts on", {
      description: canNotify
        ? "You'll be notified when a subscribed channel goes live (while the app is open). Requires YouTube sync."
        : "System notifications are blocked — you'll get in-app alerts instead. Requires YouTube sync.",
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Playback: sleep timer, auto-switch and live alerts"
                  className={cn(
                    "h-8 gap-1 rounded-lg px-2 text-xs",
                    minutesLeft
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "border-zinc-200/90 bg-zinc-100/80 text-zinc-600 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                />
              }
            >
              {minutesLeft ? (
                <>
                  <Moon className="size-3.5" />
                  <span className="font-mono text-[11px]">{minutesLeft}m</span>
                </>
              ) : (
                <Timer className="size-3.5" />
              )}
            </DropdownMenuTrigger>
          }
        />
        <TooltipContent>
          {minutesLeft
            ? `Sleep timer: ${minutesLeft} min left`
            : "Sleep timer & playback automation"}
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="w-64 rounded-xl border border-zinc-200/90 bg-white/95 p-1.5 text-zinc-900 shadow-xl backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:text-zinc-100"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            <span>Sleep timer</span>
            {minutesLeft && (
              <span className="font-mono normal-case text-indigo-600 dark:text-indigo-400">
                {minutesLeft} min left
              </span>
            )}
          </DropdownMenuLabel>
          <div className="grid grid-cols-4 gap-1 px-1 pb-1">
            {SLEEP_OPTIONS.map((m) => {
              const selected = sleepTimerEndsAt ? sleepTimerMinutes === m : m === 0;
              return (
                <DropdownMenuItem
                  key={m}
                  onClick={() => handleSleep(m)}
                  aria-pressed={selected}
                  className={cn(
                    "cursor-pointer justify-center rounded-md px-2 py-1 text-xs",
                    selected &&
                      "bg-indigo-500/15 font-semibold text-indigo-700 dark:text-indigo-300"
                  )}
                >
                  {m === 0 ? "Off" : m < 60 ? `${m}m` : `${m / 60}h`}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 bg-zinc-200/80 dark:bg-zinc-800/80" />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            Automation
          </DropdownMenuLabel>

          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => {
              const next = !autoReplaceEnded;
              setAutoReplaceEnded(next);
              toast.info(
                next
                  ? "Ended or offline live streams will switch automatically"
                  : "Auto-switch off"
              );
            }}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs"
          >
            <Radio
              className={cn(
                "size-3.5",
                autoReplaceEnded ? "text-emerald-500" : "text-zinc-500"
              )}
            />
            <span className="flex-1">
              Auto-switch ended streams
              <span className="block text-[10px] text-zinc-500">
                Queue first, then a live stream
              </span>
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {autoReplaceEnded ? "ON" : "OFF"}
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => void handleToggleLiveAlerts()}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-xs"
          >
            {liveAlertsEnabled ? (
              <Bell className="size-3.5 text-red-500" />
            ) : (
              <BellOff className="size-3.5 text-zinc-500" />
            )}
            <span className="flex-1">
              Live alerts
              <span className="block text-[10px] text-zinc-500">
                When a subscribed channel goes live
              </span>
            </span>
            <span className="font-mono text-[10px] text-zinc-500">
              {liveAlertsEnabled ? "ON" : "OFF"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
