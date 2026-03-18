"use client";

interface BrowserFrameProps {
  url?: string;
  children: React.ReactNode;
}

export function BrowserFrame({ url, children }: BrowserFrameProps) {
  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid var(--stroke)",
        overflow: "hidden",
        background: "var(--bg-card)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: "32px",
          background: "var(--bg-elevated)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "6px",
          position: "relative",
          borderBottom: "1px solid var(--stroke)",
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: "5px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "rgba(255, 95, 87, 0.25)",
            }}
          />
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "rgba(254, 188, 46, 0.25)",
            }}
          />
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "rgba(40, 200, 64, 0.25)",
            }}
          />
        </div>

        {/* URL bar */}
        {url && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "10px",
              color: "var(--text-tertiary)",
              letterSpacing: "0.02em",
            }}
          >
            {url}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--bg-card)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
