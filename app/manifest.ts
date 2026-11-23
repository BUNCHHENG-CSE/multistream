import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

/**
 * Installable web-app manifest.
 * `name` is what the install prompt, taskbar and app list show — keep it short
 * (the long SEO title lives in page metadata, not here).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description:
      "Watch multiple YouTube, Twitch & Kick live streams side by side with solo audio, live chat and saved layouts.",
    lang: "en",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["entertainment", "video", "social"],
    // Reopening the app focuses the existing window instead of opening a second one
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    prefer_related_applications: false,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Explore stream walls",
        short_name: "Explore",
        description: "Browse curated multi-stream walls",
        url: "/explore?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Open my stream grid",
        short_name: "My grid",
        description: "Jump back into your saved multi-stream grid",
        url: "/?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
