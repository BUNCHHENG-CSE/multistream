"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/90 bg-zinc-100/80 text-zinc-700 shadow-2xs transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-900 dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              className
            )}
          />
        }
      >
        {isDark ? (
          <Moon className="size-3.5 text-emerald-400 transition-transform duration-200" />
        ) : (
          <Sun className="size-3.5 text-amber-500 transition-transform duration-200" />
        )}
      </TooltipTrigger>
      <TooltipContent>
        {isDark
          ? "Dark Broadcast Mode — Click for Light Mode"
          : "Light Mode — Click for Dark Broadcast Mode"}
      </TooltipContent>
    </Tooltip>
  );
}
