"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AgentStatus } from "./data";

/* Small presentational primitives for the Agent Fleet demo, ported from the
   real mission-control design system (avatars, status dots, tags, sparklines,
   animated stat values). */

export function StatusDot({ status, size = 8 }: { status: AgentStatus; size?: number }) {
  return <span className={`af-dot af-dot-${status}`} style={{ width: size, height: size }} />;
}

export function statusColor(status: AgentStatus): string {
  switch (status) {
    case "online": return "var(--af-online)";
    case "busy": return "var(--af-busy)";
    case "idle": return "var(--af-idle)";
    case "blocked": return "var(--af-blocked)";
  }
}

const AVATAR_SIZES = {
  xs: { wh: 22, fs: 9 },
  sm: { wh: 28, fs: 11 },
  md: { wh: 40, fs: 13 },
  lg: { wh: 56, fs: 18 },
} as const;

export function Avatar({
  initials,
  bg,
  size = "md",
  status,
}: {
  initials: string;
  bg: string;
  size?: keyof typeof AVATAR_SIZES;
  status?: AgentStatus;
}) {
  const d = AVATAR_SIZES[size];
  return (
    <span className="af-avatar" style={{ background: bg, width: d.wh, height: d.wh, fontSize: d.fs }}>
      {initials}
      {status && (
        <span
          className="af-avatar-status"
          style={{ background: statusColor(status), width: size === "lg" ? 14 : 12, height: size === "lg" ? 14 : 12 }}
        />
      )}
    </span>
  );
}

export function Tag({
  variant,
  children,
  style,
}: {
  variant?: "teal" | "amber" | "red";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <span className={variant ? `af-tag af-tag-${variant}` : "af-tag"} style={style}>{children}</span>;
}

export function Spark({
  data,
  color = "#0d9488",
  width = 52,
  height = 18,
  fill = false,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map(
    (v, i) => `${(i * step).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`
  );
  const [lastX, lastY] = points[points.length - 1].split(",");
  const gid = `af-spark-${id}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${height} ${points.join(" ")} ${width},${height}`} fill={`url(#${gid})`} />
        </>
      )}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.2" fill={color} />
    </svg>
  );
}

/** Counts a plain integer up from 0 the first time it scrolls into view. */
export function NumberTicker({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  const animatable = match !== null && /^\d+$/.test(match[1]);
  const target = animatable ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : "";

  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!animatable || started.current) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const run = () => {
      if (started.current) return;
      started.current = true;
      if (reduce) {
        setShown(target);
        return;
      }
      const t0 = performance.now();
      const dur = 700;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && (run(), io.disconnect()),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [animatable, target]);

  if (!animatable) return <>{value}</>;
  return <span ref={ref}>{shown}{suffix}</span>;
}

export function StatTile({
  label,
  value,
  sub,
  up,
  warn,
  trend,
  accent = "#0d9488",
}: {
  label: string;
  value: string;
  sub: string;
  up?: boolean;
  warn?: boolean;
  trend?: number[];
  accent?: string;
}) {
  return (
    <div className="af-stat">
      <div className="af-stat-label">
        <span className="af-eyebrow" style={{ fontSize: 10.5 }}>{label}</span>
        {trend && trend.length > 1 && <Spark data={trend} color={accent} width={52} height={18} fill />}
      </div>
      <span className="af-stat-value" style={{ color: warn ? "#92400e" : "var(--af-ink)" }}>
        <NumberTicker value={value} />
      </span>
      <div className={`af-stat-sub${warn ? " af-stat-delta-warn" : ""}`} title={sub}>
        {up ? <span className="af-stat-delta-up">↑ </span> : null}
        {sub}
      </div>
    </div>
  );
}

/* ─── Sidebar icons — the hub's 16px monoline set ─────────────── */

const ICON_PATHS: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5h13l3.5 7v7H2v-7z" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6" />
      <path d="M18.2 15.4c1.7.8 2.9 2.3 3.3 4.6" />
    </>
  ),
  org: (
    <>
      <rect x="9" y="2.5" width="6" height="5" rx="1.2" />
      <rect x="2.5" y="16.5" width="6" height="5" rx="1.2" />
      <rect x="15.5" y="16.5" width="6" height="5" rx="1.2" />
      <path d="M12 7.5v4M5.5 16.5v-2.5h13v2.5M12 11.5v2.5" />
    </>
  ),
  dashboard: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7.5 14.5v3M12 10v7.5M16.5 6.5v11" />
    </>
  ),
  brain: (
    <>
      <path d="M12 4.5a3 3 0 0 0-5.8 1A3.2 3.2 0 0 0 4 8.6a3.4 3.4 0 0 0 .4 6 3 3 0 0 0 5.4 2.1c.8.9 1.5.9 2.2 0a3 3 0 0 0 5.4-2.1 3.4 3.4 0 0 0 .4-6 3.2 3.2 0 0 0-2.2-3.1 3 3 0 0 0-5.6-1z" />
      <path d="M12 4.5V19" />
    </>
  ),
  tools: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  jarvis: (
    <>
      <circle cx="12" cy="12" r="8.5" opacity="0.55" />
      <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
    </>
  ),
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
};

export function NavIcon({ name }: { name: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICON_PATHS[name] ?? ICON_PATHS.home}
    </svg>
  );
}
