import React from "react";
import type { GridPreset } from "@/db/schema";
import { cn } from "@/lib/utils";

export const GRID_PRESET_META: Array<{
  value: GridPreset;
  label: string;
  shortLabel: string;
  capacity: number;
  description: string;
}> = [
  {
    value: "1x1",
    label: "1x1 — Single Cinema",
    shortLabel: "1x1 Focus",
    capacity: 1,
    description: "Full-bleed primary broadcast stage",
  },
  {
    value: "1x2",
    label: "1x2 — Dual Split",
    shortLabel: "1x2 Split",
    capacity: 2,
    description: "Side-by-side head-to-head comparison",
  },
  {
    value: "2x2",
    label: "2x2 — Quad Matrix",
    shortLabel: "2x2 Quad",
    capacity: 4,
    description: "Balanced 4-stream director monitor",
  },
  {
    value: "1+3",
    label: "1+3 — Main Stage + 3",
    shortLabel: "1+3 Stage",
    capacity: 4,
    description: "Hero spotlight feed with 3 side monitors",
  },
  {
    value: "3x3",
    label: "3x3 — 9-Stream Wall",
    shortLabel: "3x3 Matrix",
    capacity: 9,
    description: "Full 9-channel broadcast command center",
  },
];

export function GridPresetIcon({
  preset,
  className,
}: {
  preset: GridPreset;
  className?: string;
}) {
  switch (preset) {
    case "1x1":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn("size-3.5 shrink-0", className)}
        >
          <rect
            x="1.5"
            y="2.5"
            width="13"
            height="11"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      );
    case "1x2":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn("size-3.5 shrink-0", className)}
        >
          <rect
            x="1.5"
            y="2.5"
            width="5.75"
            height="11"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <rect
            x="8.75"
            y="2.5"
            width="5.75"
            height="11"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      );
    case "2x2":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn("size-3.5 shrink-0", className)}
        >
          <rect
            x="1.5"
            y="2"
            width="5.75"
            height="5.25"
            rx="1.2"
            stroke="currentColor"
            strokeWidth="1.35"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <rect
            x="8.75"
            y="2"
            width="5.75"
            height="5.25"
            rx="1.2"
            stroke="currentColor"
            strokeWidth="1.35"
          />
          <rect
            x="1.5"
            y="8.75"
            width="5.75"
            height="5.25"
            rx="1.2"
            stroke="currentColor"
            strokeWidth="1.35"
          />
          <rect
            x="8.75"
            y="8.75"
            width="5.75"
            height="5.25"
            rx="1.2"
            stroke="currentColor"
            strokeWidth="1.35"
          />
        </svg>
      );
    case "1+3":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn("size-3.5 shrink-0", className)}
        >
          <rect
            x="1.5"
            y="2"
            width="8.25"
            height="12"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.35"
            fill="currentColor"
            fillOpacity="0.22"
          />
          <rect
            x="11.25"
            y="2"
            width="3.25"
            height="3.2"
            rx="0.8"
            fill="currentColor"
          />
          <rect
            x="11.25"
            y="6.4"
            width="3.25"
            height="3.2"
            rx="0.8"
            fill="currentColor"
          />
          <rect
            x="11.25"
            y="10.8"
            width="3.25"
            height="3.2"
            rx="0.8"
            fill="currentColor"
          />
        </svg>
      );
    case "3x3":
    default:
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className={cn("size-3.5 shrink-0", className)}
        >
          {[2, 6.6, 11.2].map((y) =>
            [1.5, 6.4, 11.3].map((x) => (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width="3.2"
                height="3.1"
                rx="0.75"
                fill="currentColor"
              />
            ))
          )}
        </svg>
      );
  }
}
