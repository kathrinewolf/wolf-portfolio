"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STATIONS as REGIONS } from "@/lib/room-world";
import type { RegionScreen } from "./RoomScene";

// The console layer: station feed chips, the HUD trace line, the tether
// from the open panel back to its station, and the in-room station
// labels. All per-frame positioning mutates styles directly.

// feed-switcher chips — one per station, in tour order
export const PROMPTS: { regionIndex: number; text: string }[] = REGIONS.map(
  (st, i) => ({
    regionIndex: i,
    text: `${st.number} · ${st.label.toLowerCase()}`,
  })
);


// ========================= REGION LABELS =========================

interface RegionLabelsProps {
  visible: boolean;
  regionScreenRef: React.RefObject<RegionScreen[]>;
  openRegion: number | null;
  onRegionClick: (regionIndex: number) => void;
}

export function RegionLabels({
  visible,
  regionScreenRef,
  openRegion,
  onRegionClick,
}: RegionLabelsProps) {
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openRef = useRef(openRegion);
  openRef.current = openRegion;
  // drag discrimination: a rotate gesture that starts on a label must not
  // fire a recall on release
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // hidden: park the labels once, run no loop (battery)
    if (!visible) {
      for (const el of labelRefs.current) {
        if (el) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
      }
      return;
    }
    let raf: number;
    const syncOnce = () => {
      const screens = regionScreenRef.current;
      if (!screens) return;
      for (let i = 0; i < REGIONS.length; i++) {
        const el = labelRefs.current[i];
        const s = screens[i];
        if (!el || !s) continue;
        if (!s.visible) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          continue;
        }
        el.style.left = `${s.x}%`;
        el.style.top = `${s.y}%`;
        const active = openRef.current === i;
        el.style.opacity = active ? "1" : "0.75";
        el.style.transform = `translate(-50%, -50%) scale(${active ? 1.05 : 1})`;
        el.style.pointerEvents = "auto";
      }
    };
    const loop = () => {
      syncOnce();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    if (process.env.NODE_ENV !== "production") {
      window.__brainSyncOverlay = syncOnce; // one-shot, never self-schedules
    }
    return () => {
      cancelAnimationFrame(raf);
      if (process.env.NODE_ENV !== "production") {
        delete window.__brainSyncOverlay;
      }
    };
  }, [regionScreenRef, visible]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
      {REGIONS.map((region, i) => (
        <button
          key={region.id}
          ref={(el) => {
            labelRefs.current[i] = el;
          }}
          data-hover
          className="recall-label"
          aria-label={`Recall ${region.label}`}
          onPointerDown={(e) => {
            downPosRef.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={(e) => {
            const d = downPosRef.current;
            downPosRef.current = null;
            if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return;
            onRegionClick(i);
          }}
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <span className="recall-label-num">{region.number}</span>
          {region.label}
        </button>
      ))}
    </div>
  );
}

// ========================= TETHER =========================

// A thin luminous line from the open panel's edge to the (rotating) lobe.
// Drawn as a single absolutely-positioned div, rescaled every frame.

interface TetherProps {
  regionIndex: number | null;
  regionScreenRef: React.RefObject<RegionScreen[]>;
  /** panel anchor in viewport percent coords */
  anchor: { x: number; y: number } | null;
}

export function Tether({ regionIndex, regionScreenRef, anchor }: TetherProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef(anchor);
  anchorRef.current = anchor;

  useEffect(() => {
    const el = lineRef.current;
    // no open panel: park hidden, run no loop
    if (regionIndex === null) {
      if (el) el.style.opacity = "0";
      return;
    }
    let raf: number;
    const update = () => {
      raf = requestAnimationFrame(update);
      const a = anchorRef.current;
      const screens = regionScreenRef.current;
      if (!el) return;
      if (!a || !screens || !screens[regionIndex].visible) {
        el.style.opacity = "0";
        return;
      }
      const s = screens[regionIndex];
      const x1 = (a.x / 100) * window.innerWidth;
      const y1 = (a.y / 100) * window.innerHeight;
      const x2 = (s.x / 100) * window.innerWidth;
      const y2 = (s.y / 100) * window.innerHeight;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      el.style.opacity = "1";
      el.style.left = `${x1}px`;
      el.style.top = `${y1}px`;
      el.style.width = `${len}px`;
      el.style.transform = `rotate(${ang}rad)`;
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [regionScreenRef, regionIndex]);

  return <div ref={lineRef} className="recall-tether" style={{ opacity: 0 }} />;
}

// ========================= HUD TRACE =========================

export function HudTrace({ regionIndex }: { regionIndex: number | null }) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (regionIndex === null) {
      setLine(null);
      return;
    }
    const region = REGIONS[regionIndex];
    // typewriter-ish reveal
    const full = `FEED ${region.number} · ${region.label.toUpperCase()} · SIGNAL LOCKED`;
    let i = 0;
    setLine("");
    const iv = setInterval(() => {
      i += 3;
      setLine(full.slice(0, i));
      if (i >= full.length) clearInterval(iv);
    }, 24);
    return () => clearInterval(iv);
  }, [regionIndex]);

  return (
    <AnimatePresence>
      {line !== null && (
        <motion.div
          className="recall-hud"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {line}
          <span className="recall-hud-cursor" aria-hidden>
            _
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ========================= PROMPT BAR =========================

interface PromptBarProps {
  visible: boolean;
  /** a panel is open — bar repositions so chips stay reachable */
  panelOpen: boolean;
  openRegion: number | null;
  visited: Set<number>;
  onPrompt: (regionIndex: number) => void;
}

export function PromptBar({
  visible,
  panelOpen,
  openRegion,
  visited,
  onPrompt,
}: PromptBarProps) {
  return (
    <div
      className={"prompt-bar" + (panelOpen ? " prompt-bar-open" : "")}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div className="prompt-bar-title" aria-hidden>
        feeds
      </div>
      <div className="prompt-chips">
        {PROMPTS.map((p) => {
          const isOpen = openRegion === p.regionIndex;
          const isVisited = visited.has(p.regionIndex);
          return (
            <button
              key={p.regionIndex}
              data-hover
              className={
                "prompt-chip" +
                (isOpen ? " prompt-chip-open" : "") +
                (isVisited && !isOpen ? " prompt-chip-visited" : "")
              }
              onClick={() => onPrompt(p.regionIndex)}
            >
              {p.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
