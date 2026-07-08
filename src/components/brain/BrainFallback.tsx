"use client";

import { REGIONS } from "@/lib/interior-world";

// Static fallback when WebGL is unavailable: the five regions as a plain
// button grid, wired to the same content overlay as the 3D interior.

export function BrainFallback({
  onRegionOpen,
}: {
  onRegionOpen: (regionIndex: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: "24px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          letterSpacing: "0.1em",
          color: "var(--text-secondary)",
          textAlign: "center",
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        Your browser can&apos;t render the 3D brain, so here&apos;s the map instead.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          width: "100%",
          maxWidth: 560,
        }}
      >
        {REGIONS.map((region, i) => (
          <button
            key={region.id}
            data-hover
            className="region-label"
            onClick={() => onRegionOpen(i)}
            style={{
              position: "relative",
              left: "auto",
              top: "auto",
              transform: "none",
              opacity: 1,
              pointerEvents: "auto",
              alignItems: "flex-start",
              textAlign: "left",
              whiteSpace: "normal",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(5, 5, 7, 0.85)",
              padding: "14px 16px",
            }}
          >
            <span className="region-label-title">{region.label}</span>
            <span className="region-label-desc">{region.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
