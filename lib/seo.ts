export const PRODUCTION_URL = "https://tct-multistream.vercel.app";

export function getBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (envUrl) {
    const trimmed = envUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/$/, "");
    }
    const isLocal =
      trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1");
    return `${isLocal ? "http" : "https"}://${trimmed}`.replace(/\/$/, "");
  }

  // Fallback to official production domain for canonical SEO indexing and social tags
  return PRODUCTION_URL;
}

export const siteConfig = {
  name: "TCT MultiStream",
  shortName: "MultiStream",
  title: "TCT MultiStream — Watch Multiple YouTube Live Streams Simultaneously",
  description:
    "Free multi-YouTube live stream viewer and command center. Watch multiple live streams at once in synchronized theater grids (1x1, 1x2, 2x2, 1+3, 3x3) with solo audio switching, integrated live chat, and cloud layout sharing.",
  url: getBaseUrl(),
  keywords: [
    "watch multiple youtube live streams",
    "youtube multi stream viewer",
    "multiview youtube",
    "multiple youtube streams at once",
    "youtube multistream player",
    "watch youtube streams side by side",
    "multitwitch for youtube",
    "dual youtube live stream",
    "quad stream youtube",
    "youtube 3x3 grid viewer",
    "simultaneous youtube streams",
    "esports multiview player",
    "youtube live audio solo",
    "youtube live chat switcher",
    "synchronized multi live stream",
    "twitch youtube multi viewer",
    "multi camera live viewer",
    "watch party youtube live",
    "tct multistream",
  ],
  author: {
    name: "TCT MultiStream Team",
    url: getBaseUrl(),
  },
  creator: "TCT MultiStream",
  publisher: "TCT MultiStream",
  category: "technology",
  social: {
    twitter: "@TCTMultiStream",
  },
};

export function getWebApplicationSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    alternateName: [
      "TCT Multi-YouTube Live Stream",
      "MultiStream Viewer",
      "YouTube MultiView Command Center",
    ],
    url: baseUrl,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    softwareVersion: "1.0.0",
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Simultaneous Multi-YouTube Live Stream playback up to 9 streams",
      "Dynamic Grid Layout Presets: 1x1, 1x2, 2x2, 1+3 Stage, 3x3 Command Center",
      "One-click Solo Audio Switching without iframe reload",
      "Integrated collapsible YouTube Live Chat with stream switcher",
      "Cloud layout persistence with custom public sharing URLs",
      "Audio equalizer, ambient soundscapes, and ambilight theater glow",
      "Support for YouTube, Twitch, and Kick streams",
    ],
    screenshot: `${baseUrl}/opengraph-image`,
  };
}

export function getWebSiteSchema() {
  const baseUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: baseUrl,
    description: siteConfig.description,
    inLanguage: "en-US",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I watch multiple YouTube live streams at once?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Paste YouTube live stream links, standard video URLs, or 11-character video IDs into TCT MultiStream, choose your theater grid preset (1x1, 1x2, 2x2, 1+3, or 3x3), and watch all streams simultaneously in real-time.",
        },
      },
      {
        "@type": "Question",
        name: "Can I listen to only one stream's audio while watching all of them?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! TCT MultiStream includes a Solo Audio toggle that uses the YouTube IFrame API to unmute one stream and instantly mute all other streams without reloading any video player.",
        },
      },
      {
        "@type": "Question",
        name: "Does TCT MultiStream support YouTube Live Chat?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, an official interactive YouTube Live Chat sidebar is embedded. You can open the sidebar and easily switch the chat feed to any active stream with a single click.",
        },
      },
      {
        "@type": "Question",
        name: "Can I save and share my multi-stream layout with friends?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! You can save your customized stream configurations and grid presets to the cloud and share them with a public link (/watch/[layoutId]) for synchronized watch parties.",
        },
      },
      {
        "@type": "Question",
        name: "Is TCT MultiStream free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, TCT MultiStream is 100% free with no account mandatory for basic viewing, no software download, and no browser extensions required.",
        },
      },
    ],
  };
}
