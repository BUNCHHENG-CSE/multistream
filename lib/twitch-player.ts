/**
 * Minimal loader + types for Twitch's official Embed Player API
 * (https://dev.twitch.tv/docs/embed/video-and-clips/), which — unlike the bare
 * player iframe — exposes mute, volume and play/pause controls.
 */

export interface TwitchPlayer {
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  play(): void;
  pause(): void;
  isPaused(): boolean;
  addEventListener(event: string, callback: () => void): void;
}

interface TwitchPlayerConstructor {
  new (
    element: HTMLElement,
    options: {
      channel: string;
      parent: string[];
      width: string | number;
      height: string | number;
      autoplay?: boolean;
      muted?: boolean;
    }
  ): TwitchPlayer;
  READY: string;
  PLAY: string;
  PLAYING: string;
  PAUSE: string;
  ENDED: string;
  ONLINE: string;
  OFFLINE: string;
}

interface TwitchNamespace {
  Player: TwitchPlayerConstructor;
}

declare global {
  interface Window {
    Twitch?: TwitchNamespace;
  }
}

const SCRIPT_SRC = "https://player.twitch.tv/js/embed/v1.js";
let loader: Promise<TwitchNamespace> | null = null;

export function loadTwitchPlayerApi(): Promise<TwitchNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Twitch player is browser-only"));
  }
  if (window.Twitch?.Player) return Promise.resolve(window.Twitch);
  if (loader) return loader;

  loader = new Promise<TwitchNamespace>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.Twitch?.Player) resolve(window.Twitch);
      else reject(new Error("Twitch player API unavailable"));
    };
    script.onerror = () => {
      loader = null; // allow a retry later
      reject(new Error("Failed to load Twitch player API"));
    };
    document.head.appendChild(script);
  });
  return loader;
}
