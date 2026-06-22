"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/*
  The iceKore Agent Fleet.
  An all-SVG orchestration scene: one orchestrator at the centre, a ring of
  specialized agents, animated "data" pulses travelling the spokes, and a live
  activity ticker. Mirrors the neural-brain theme of the site.

  Geometry lives in a fixed viewBox so the circle stays round and scales
  perfectly with preserveAspectRatio. Coordinates are computed once at module
  load (pure trig, no Date/random) so SSR and client agree.
*/

const ACCENT = "180, 200, 240"; // cool blue-white, matches the brain nodes
const LIVE = "150, 240, 190"; // soft green for "online"

const VIEW_W = 1000;
const VIEW_H = 600;
const CX = 500;
const CY = 300;
const R = 196;

interface Agent {
  id: string;
  label: string;
  role: string;
}

// 11 agents → "10+ working autonomously". Grounded in the real iceKore setup:
// channel agents + an orchestrator + the connected MCP systems + the vault.
const AGENTS: Agent[] = [
  { id: "media", label: "media-buying", role: "Paid acquisition" },
  { id: "seo", label: "seo-blog", role: "Programmatic SEO" },
  { id: "email", label: "email", role: "Lifecycle flows" },
  { id: "analyst", label: "cmo-analyst", role: "Decision briefs" },
  { id: "cro", label: "cro", role: "Conversion tests" },
  { id: "gmail", label: "gmail", role: "Inbox + drafts" },
  { id: "calendar", label: "calendar", role: "Scheduling" },
  { id: "whatsapp", label: "whatsapp", role: "Supplier chat" },
  { id: "alibaba", label: "alibaba", role: "Sourcing + orders" },
  { id: "vault", label: "vault", role: "Memory + truth" },
  { id: "creative", label: "creative", role: "Ad creative" },
];

type Placed = Agent & {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  lx: number;
  ly: number;
};

const PLACED: Placed[] = AGENTS.map((a, i) => {
  const angle = (-90 + i * (360 / AGENTS.length)) * (Math.PI / 180);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x = CX + R * cos;
  const y = CY + R * sin;
  const anchor: Placed["anchor"] = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";
  const lx = CX + (R + 26) * cos + (anchor === "start" ? 8 : anchor === "end" ? -8 : 0);
  const ly = CY + (R + 26) * sin + (Math.abs(cos) < 0.25 ? (sin > 0 ? 12 : -6) : 4);
  return { ...a, x, y, anchor, lx, ly };
});

// Live ticker copy — accurate to the real operation, nothing sensitive.
const FEED: { agent: string; action: string }[] = [
  { agent: "cmo-analyst", action: "wrote the weekly decision brief" },
  { agent: "media-buying", action: "synced Meta + Google ad spend" },
  { agent: "seo-blog", action: "shipped a new winter-bathing guide" },
  { agent: "alibaba", action: "reconciled supplier orders" },
  { agent: "vault", action: "indexed 1,700+ email threads" },
  { agent: "email", action: "queued the nurture flow" },
  { agent: "whatsapp", action: "flagged a customer follow-up" },
  { agent: "cro", action: "proposed a landing-page test" },
  { agent: "gmail", action: "drafted 3 replies for review" },
  { agent: "calendar", action: "booked a supplier call" },
];

interface Props {
  isVisible: boolean;
}

export function AgentFleetDemo({ isVisible }: Props) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const [feedIdx, setFeedIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  // Cycle the activity feed only while on-screen.
  useEffect(() => {
    if (!isVisible || reduce) return;
    timer.current = setInterval(() => {
      setFeedIdx((i) => (i + 1) % FEED.length);
    }, 2200);
    return () => clearInterval(timer.current);
  }, [isVisible, reduce]);

  const animate = isVisible && !reduce;
  const current = FEED[feedIdx];

  // Pre-compute spoke pulse timings so they stagger evenly.
  const pulses = useMemo(
    () =>
      PLACED.map((p, i) => ({
        ...p,
        delay: (i / PLACED.length) * 2.4,
      })),
    []
  );

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        border: "1px solid var(--stroke)",
        background:
          "radial-gradient(120% 120% at 50% 0%, rgba(30,34,48,0.55) 0%, var(--bg-card) 60%)",
        overflow: "hidden",
      }}
    >
      {/* Top status bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "13px 16px",
          borderBottom: "1px solid var(--stroke)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `rgba(${LIVE},0.9)`,
              boxShadow: `0 0 8px 1px rgba(${LIVE},0.5)`,
            }}
          />
          {animate && (
            <motion.span
              animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: `1px solid rgba(${LIVE},0.6)`,
              }}
            />
          )}
        </span>
        <span
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          11 agents · autonomous · always on
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            border: "1px solid var(--stroke)",
            borderRadius: 5,
            padding: "3px 7px",
          }}
        >
          MCP · Claude
        </span>
      </div>

      {/* Scene — orbit on desktop, compact stack on mobile */}
      {isMobile && <MobileScene isVisible={isVisible} animate={animate} />}
      {!isMobile && (
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        style={{ display: "block", aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
        role="img"
        aria-label="Diagram of the iceKore agent fleet: a central orchestrator connected to eleven autonomous agents."
      >
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgba(${ACCENT},0.30)`} />
            <stop offset="55%" stopColor={`rgba(${ACCENT},0.06)`} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="spoke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={`rgba(${ACCENT},0.32)`} />
            <stop offset="100%" stopColor={`rgba(${ACCENT},0.07)`} />
          </linearGradient>
        </defs>

        {/* Ambient core glow */}
        <circle cx={CX} cy={CY} r={250} fill="url(#core-glow)" />

        {/* Concentric guide rings */}
        {[R, R * 0.62].map((rr, i) => (
          <circle
            key={`ring-${i}`}
            cx={CX}
            cy={CY}
            r={rr}
            fill="none"
            stroke={`rgba(${ACCENT},0.06)`}
            strokeWidth={1}
          />
        ))}

        {/* Spokes */}
        {pulses.map((p) => (
          <line
            key={`spoke-${p.id}`}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="url(#spoke)"
            strokeWidth={1.2}
          />
        ))}

        {/* Travelling data pulses (centre → agent) */}
        {animate &&
          pulses.map((p) => (
            <motion.circle
              key={`pulse-${p.id}`}
              r={3}
              fill={`rgba(${ACCENT},0.95)`}
              initial={{ cx: CX, cy: CY, opacity: 0 }}
              animate={{
                cx: [CX, p.x],
                cy: [CY, p.y],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.6,
                delay: p.delay,
                repeat: Infinity,
                repeatDelay: 1.0,
                ease: "easeInOut",
              }}
              style={{ filter: `drop-shadow(0 0 4px rgba(${ACCENT},0.8))` }}
            />
          ))}

        {/* Agent nodes */}
        {pulses.map((p, i) => (
          <g key={`node-${p.id}`}>
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={9}
              fill="var(--bg-deep)"
              stroke={`rgba(${ACCENT},0.5)`}
              strokeWidth={1.4}
              initial={{ scale: 0, opacity: 0 }}
              animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
            <motion.circle
              cx={p.x}
              cy={p.y}
              r={3}
              fill={`rgba(${ACCENT},0.95)`}
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
            />
            <motion.text
              x={p.lx}
              y={p.ly}
              textAnchor={p.anchor}
              initial={{ opacity: 0 }}
              animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.05 }}
              fontFamily="var(--font-geist-mono), monospace"
              fontSize={13}
              letterSpacing="0.04em"
              fill="rgba(255,255,255,0.62)"
            >
              {p.label}
            </motion.text>
          </g>
        ))}

        {/* Orchestrator — rotating dashed ring */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={40}
          fill="none"
          stroke={`rgba(${ACCENT},0.3)`}
          strokeWidth={1.2}
          strokeDasharray="3 7"
          animate={animate ? { rotate: 360 } : {}}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        {/* Orchestrator core */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={28}
          fill="var(--bg-surface)"
          stroke={`rgba(${ACCENT},0.7)`}
          strokeWidth={1.6}
          initial={{ scale: 0 }}
          animate={isVisible ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "center", filter: `drop-shadow(0 0 14px rgba(${ACCENT},0.35))` }}
        />
        {animate && (
          <motion.circle
            cx={CX}
            cy={CY}
            r={28}
            fill="none"
            stroke={`rgba(${ACCENT},0.5)`}
            strokeWidth={1}
            animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        )}
        <text
          x={CX}
          y={CY - 2}
          textAnchor="middle"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize={12}
          fontWeight={600}
          letterSpacing="0.02em"
          fill="rgba(255,255,255,0.92)"
        >
          brain
        </text>
        <text
          x={CX}
          y={CY + 13}
          textAnchor="middle"
          fontFamily="var(--font-geist-mono), monospace"
          fontSize={9}
          letterSpacing="0.16em"
          fill="rgba(255,255,255,0.4)"
        >
          ORCHESTRATOR
        </text>
      </svg>
      )}

      {/* Live activity ticker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderTop: "1px solid var(--stroke)",
          background: "rgba(255,255,255,0.015)",
          minHeight: 44,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: `rgba(${LIVE},0.85)`,
            flexShrink: 0,
          }}
        >
          live
        </span>
        <div style={{ position: "relative", flex: 1, height: 18, overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={feedIdx}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  color: `rgba(${ACCENT},0.95)`,
                  fontSize: 11.5,
                }}
              >
                {current.agent}
              </span>
              <span style={{ color: "var(--text-tertiary)" }}>·</span>
              <span style={{ color: "var(--text-secondary)" }}>{current.action}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ───────── Mobile: compact hub + readable agent grid ───────── */

const MOBILE_HUB_DOTS = Array.from({ length: 6 }, (_, i) => {
  const a = (-90 + i * 60) * (Math.PI / 180);
  return { x: 150 + 60 * Math.cos(a), y: 86 + 60 * Math.sin(a), delay: i * 0.28 };
});

function MobileScene({ isVisible, animate }: { isVisible: boolean; animate: boolean }) {
  return (
    <div style={{ padding: "22px 14px 6px" }}>
      <svg
        viewBox="0 0 300 178"
        width="100%"
        style={{ display: "block", maxWidth: 340, margin: "0 auto" }}
        role="img"
        aria-label="The iceKore orchestrator coordinating its agents."
      >
        <defs>
          <radialGradient id="core-glow-m" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgba(${ACCENT},0.26)`} />
            <stop offset="60%" stopColor={`rgba(${ACCENT},0.05)`} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        <circle cx={150} cy={86} r={92} fill="url(#core-glow-m)" />
        <circle cx={150} cy={86} r={60} fill="none" stroke={`rgba(${ACCENT},0.07)`} strokeWidth={1} />

        {MOBILE_HUB_DOTS.map((d, i) => (
          <line key={`ms-l-${i}`} x1={150} y1={86} x2={d.x} y2={d.y} stroke={`rgba(${ACCENT},0.16)`} strokeWidth={1} />
        ))}
        {animate &&
          MOBILE_HUB_DOTS.map((d, i) => (
            <motion.circle
              key={`ms-p-${i}`}
              r={2.4}
              fill={`rgba(${ACCENT},0.95)`}
              initial={{ cx: 150, cy: 86, opacity: 0 }}
              animate={{ cx: [150, d.x], cy: [86, d.y], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.5, delay: d.delay, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
            />
          ))}
        {MOBILE_HUB_DOTS.map((d, i) => (
          <circle key={`ms-d-${i}`} cx={d.x} cy={d.y} r={4} fill="var(--bg-deep)" stroke={`rgba(${ACCENT},0.5)`} strokeWidth={1.2} />
        ))}

        <motion.circle
          cx={150}
          cy={86}
          r={30}
          fill="none"
          stroke={`rgba(${ACCENT},0.3)`}
          strokeWidth={1}
          strokeDasharray="3 6"
          animate={animate ? { rotate: 360 } : {}}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
        <circle cx={150} cy={86} r={22} fill="var(--bg-surface)" stroke={`rgba(${ACCENT},0.7)`} strokeWidth={1.4} />
        {animate && (
          <motion.circle
            cx={150}
            cy={86}
            r={22}
            fill="none"
            stroke={`rgba(${ACCENT},0.5)`}
            strokeWidth={1}
            animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        )}
        <text x={150} y={84} textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize={11} fontWeight={600} fill="rgba(255,255,255,0.92)">
          brain
        </text>
        <text x={150} y={96} textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize={7} letterSpacing="0.14em" fill="rgba(255,255,255,0.4)">
          ORCHESTRATOR
        </text>
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 6 }}>
        {AGENTS.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "9px 10px",
              borderRadius: 10,
              border: "1px solid var(--stroke)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: `rgba(${ACCENT},0.9)`,
                boxShadow: `0 0 6px 1px rgba(${ACCENT},0.4)`,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {a.label}
              </div>
              <div style={{ fontSize: 9.5, color: "var(--text-tertiary)", marginTop: 1 }}>{a.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
