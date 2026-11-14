# TCT MultiStream — Multi-YouTube Live Stream Viewer

An all-in-one **Multi-YouTube Live Stream Command Center** built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS + Shadcn UI**, **Zustand**, **Better Auth**, and **Neon Serverless PostgreSQL + Prisma ORM**.

## Features

- **Flexible YouTube URL & Video ID Parser:** Paste standard `youtube.com/watch?v=`, live `youtube.com/live/`, shortened `youtu.be/`, embed URLs, or raw 11-character Video IDs with instant regex validation and Toast notifications.
- **Dynamic Theater Grid Engine (`h-[calc(100vh-4rem)]`):**
  - `1x1` — Single Focus
  - `1x2` — Side-by-Side Split
  - `2x2` — Quad View
  - `1+3` — 1 Large Main Stage + 3 Stacked Side Streams
  - `3x3` — 9-Stream Command Center
- **Smart Audio & Stream Controls:**
  - **Solo Audio Toggle:** Uses the YouTube IFrame Player API (`postMessage`) to unmute one stream and automatically mute all others without reloading iframes.
  - **Swap to Main:** Promote any secondary stream to the primary slot (`#1`).
  - **Chat Focus:** Switch the collapsible Live Chat sidebar to any active stream.
  - **Global Mute All:** Mute all active streams from the top bar.
- **Collapsible Live Chat Sidebar:** Embeds official YouTube Live Chat (`https://www.youtube.com/live_chat?v={VIDEO_ID}&embed_domain={DOMAIN}`) with a stream selector dropdown.
- **Cloud Persistence & Read-Only Sharing (Neon + Prisma ORM):**
  - Save custom layouts (`title`, `gridPreset`, `streams`, `isPublic`) to Neon PostgreSQL.
  - Share public layouts via `/watch/[layoutId]`.

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```
2. Configure `.env` (see `.env.example`):
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma Client & sync schema to Neon PostgreSQL:
   ```bash
   bun run db:generate
   bun run db:push
   ```
4. Start the development server:
   ```bash
   bun run dev
   ```
