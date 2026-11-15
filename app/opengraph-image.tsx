import { ImageResponse } from "next/og";

export const alt =
  "TCT MultiStream — Watch Multiple YouTube Live Streams Simultaneously";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #18181b 2%, transparent 0%), radial-gradient(circle at 75px 75px, #18181b 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#fafafa",
          border: "8px solid #18181b",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header / Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#10b981",
              boxShadow: "0 0 24px rgba(16, 185, 129, 0.4)",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "3px solid #ffffff",
                borderRadius: "4px",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: "15px",
              fontWeight: 700,
              color: "#34d399",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <span>LIVE MULTIVIEW STUDIO</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              background: "linear-gradient(to right, #ffffff, #e4e4e7, #a1a1aa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            TCT MultiStream
          </div>
          <div
            style={{
              fontSize: "30px",
              fontWeight: 600,
              color: "#34d399",
              letterSpacing: "-0.01em",
            }}
          >
            Watch Multiple YouTube Live Streams Simultaneously
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "#a1a1aa",
              maxWidth: "960px",
              lineHeight: 1.4,
            }}
          >
            Command center for esports, breaking news, NASA launches, and live
            events. Synchronized theater grids up to 9 streams, instant solo
            audio switcher, live chat toggle, and cloud layout sharing.
          </div>
        </div>

        {/* Footer Feature Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: "24px",
            borderTop: "1px solid #27272a",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#d4d4d8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#10b981", fontSize: "20px" }}>•</span> 1x1 to 3x3 Theater
              Grids
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#10b981", fontSize: "20px" }}>•</span> Solo Audio Focus
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#10b981", fontSize: "20px" }}>•</span> YouTube Live Chat
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#10b981", fontSize: "20px" }}>•</span> Free &amp; No Install
            </div>
          </div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#71717a",
            }}
          >
            tct-multistream.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
