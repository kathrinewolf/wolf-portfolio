"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AGENTS,
  FEED_AGES,
  FEED_SCRIPT,
  FEED_SEED,
  HANDOFFS,
  NAV_SECTIONS,
  TOTALS,
  type Cadence,
  type DemoAgent,
  type DemoFeedEvent,
} from "./data";
import { Avatar, NavIcon, Spark, StatTile, StatusDot, Tag } from "./ui";

/* A faithful replica of the hub's Team screen (mission control), driven by
   the example data in data.ts. No network, no persistence. The simulation
   (feed ticks, working-on rotation) starts client-side after mount, so
   server and client render identically. */

const byId = new Map(AGENTS.map((a) => [a.id, a]));

type FeedItem = DemoFeedEvent & { id: number };

/** Seed items get stable negative ids so React keys never collide with live ones. */
const SEEDED_FEED: FeedItem[] = FEED_SEED.map((e, i) => ({ ...e, id: -(i + 1) }));

export function DemoApp() {
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    setToast({ key: Date.now(), text });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* Feed simulation. Script position and item ids live in refs so the
     capped buffer never corrupts the cycle, and keys stay stable. */
  const [extraFeed, setExtraFeed] = useState<FeedItem[]>([]);
  const [syncSec, setSyncSec] = useState(0);
  const [workTick, setWorkTick] = useState(0);
  const feedSeq = useRef(0);
  const scriptIdx = useRef(0);

  const pushFeed = useCallback((ev: DemoFeedEvent) => {
    feedSeq.current += 1;
    const item: FeedItem = { ...ev, id: feedSeq.current };
    setExtraFeed((prev) => [item, ...prev].slice(0, 24));
    setSyncSec(0);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const feed = setInterval(() => {
      pushFeed(FEED_SCRIPT[scriptIdx.current % FEED_SCRIPT.length]);
      scriptIdx.current += 1;
    }, 6000);
    const clock = setInterval(() => setSyncSec((s) => s + 1), 1000);
    const work = setInterval(() => setWorkTick((t) => t + 1), 9000);
    return () => {
      clearInterval(feed);
      clearInterval(clock);
      clearInterval(work);
    };
  }, [pushFeed]);

  const feedItems = useMemo(
    () => [...extraFeed, ...SEEDED_FEED].slice(0, FEED_AGES.length),
    [extraFeed]
  );

  /* Rotate "working on" lines among agents that have alternates. */
  const workingOn = useMemo(() => {
    const rotating = AGENTS.filter((a) => a.alsoWorksOn.length > 0);
    const lines = new Map<string, string>();
    rotating.forEach((a, i) => {
      const all = [a.workingOn, ...a.alsoWorksOn];
      const bump = Math.floor((workTick + i) / rotating.length);
      lines.set(a.id, all[bump % all.length]);
    });
    return lines;
  }, [workTick]);

  const runStandup = () => {
    pushFeed({ agentId: "marketing-cos", what: "ran a stand-up, 12 of 12 agents reported in", live: true });
    showToast("No stand-up was actually dispatched. In the live hub this pings every agent for a status report.");
  };

  return (
    <div className="af-app">
      <Sidebar onNav={(label) => showToast(`Only the Team screen is in this demo. "${label}" is a full page in the live hub.`)} />

      <div className="af-main">
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 className="af-display" style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: 1.15 }}>Team</h1>
              <span className="af-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 10.5 }}>
                <span className="af-dot af-dot-busy" style={{ width: 6, height: 6 }} />
                synced {syncSec}s ago · {TOTALS.agents} agents
              </span>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12, color: "var(--af-text-mute)", flexWrap: "wrap" }}>
              <HealthPip color="#15803d" label="online" count={TOTALS.online} />
              <HealthPip color="#ca8a04" label="idle" count={TOTALS.idle} />
              {TOTALS.blocked > 0 && <HealthPip color="#b91c1c" label="needs you" count={TOTALS.blocked} />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="af-btn" disabled title="Scaffold a new agent from the fleet templates (coming soon)">
              ＋ Hire agent
            </button>
            <button
              className="af-btn"
              onClick={() => showToast("Task creation is off in the demo. In the live hub this briefs an agent and the task lands on its board.")}
            >
              ＋ New task
            </button>
            <button className="af-btn af-btn-primary" onClick={runStandup}>
              Run stand-up
            </button>
          </div>
        </div>

        {/* ── Stat strip ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
          <span style={{ fontSize: 11.5, color: "var(--af-text-mute)" }}>Vault-derived metrics</span>
          <span style={{ fontSize: 11.5, color: "var(--af-ok)" }}>· newest fleet output 12m ago</span>
          <span style={{ fontSize: 11.5, color: "var(--af-text-faint)" }}>· demo data</span>
        </div>
        <div className="af-glass af-statstrip" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
          <StatTile
            label="Tasks shipped this week"
            value={String(TOTALS.tasksThisWeek)}
            sub="across all agents · last 7 days"
            up
            trend={TOTALS.weekTrend}
          />
          <StatTile label="Avg quality rating" value="—" sub="ratings not tracked yet" accent="#ca8a04" />
          <StatTile label="Needs your review" value={String(TOTALS.needsReview)} sub="1 urgent · handoffs awaiting your call" warn />
        </div>

        {/* ── Cadence board ── */}
        <CadenceBoard />

        {/* ── Departments + right rail ── */}
        <div className="af-mcgrid">
          <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            <Department
              dept="Marketing"
              agents={AGENTS.filter((a) => a.dept === "Marketing")}
              defaultExpanded="media-buying"
              workingOn={workingOn}
              onAction={showToast}
            />
            <Department
              dept="Operations"
              agents={AGENTS.filter((a) => a.dept === "Operations")}
              directReports
              workingOn={workingOn}
              onAction={showToast}
            />
          </div>
          <div className="af-rail">
            <NeedsYou onOpen={showToast} />
            <LiveFeed items={feedItems} />
            <Activity />
          </div>
        </div>
      </div>

      {toast && (
        <div key={toast.key} className="af-toast" role="status">
          <span className="af-band-dot" style={{ marginTop: 5 }} />
          <span>
            <strong>Demo.</strong> {toast.text}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Sidebar (mirrors AlNav) ─────────────── */

function Sidebar({ onNav }: { onNav: (label: string) => void }) {
  return (
    <aside className="af-sidebar">
      <div className="af-sidebar-brand">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <defs>
            <linearGradient id="af-logo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>
          </defs>
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="url(#af-logo)" />
          <path d="M12 7 L17 12 L12 17 L7 12 Z" fill="rgba(255,255,255,0.85)" />
        </svg>
        <span className="af-display" style={{ fontSize: 17 }}>iceKore</span>
      </div>

      <button
        className="af-search-pill"
        onClick={() => onNav("Search")}
        aria-label="Search (demo)"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        Search
        <span className="af-search-kbd">⌘K</span>
      </button>

      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="af-sidebar-section">
          <div className="af-sidebar-section-title">{section.title}</div>
          {section.items.map((item) => (
            <button
              key={item.label}
              title={`${item.label} · ${item.sub}`}
              className={`af-sidebar-item${item.active ? " is-active" : ""}`}
              onClick={item.active ? undefined : () => onNav(item.label)}
            >
              <span className="af-sidebar-item-icon"><NavIcon name={item.icon} /></span>
              {item.label}
              {item.badge && (
                <span className="af-sidebar-item-end">
                  <Tag variant="teal" style={{ height: 17, fontSize: 10, padding: "0 6px" }}>{item.badge}</Tag>
                </span>
              )}
            </button>
          ))}
        </div>
      ))}

      <div className="af-sidebar-foot">
        <span className="af-glass-thin" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", fontSize: 11, color: "var(--af-text-mute)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--af-ok)", display: "inline-block" }} />
          demo · example data
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px 0" }}>
          <span className="af-avatar" style={{ background: "linear-gradient(135deg, #fde68a, #f59e0b)", width: 28, height: 28, fontSize: 11 }}>
            W
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Wolf</span>
            <span style={{ fontSize: 11, color: "var(--af-text-mute)" }}>Founder</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

function HealthPip({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 0 3px ${color}22`, display: "inline-block" }} />
      <span className="af-num" style={{ color: "var(--af-ink-2)", fontWeight: 600 }}>{count}</span>
      <span style={{ color: "var(--af-text-mute)" }}>{label}</span>
    </span>
  );
}

/* ─── Cadence board ─────────────── */

const BANDS: { key: string; label: string; cadences: Cadence[] }[] = [
  { key: "daily", label: "Daily & live", cadences: ["live", "daily"] },
  { key: "weekly", label: "Weekly", cadences: ["weekly"] },
  { key: "monthly", label: "Monthly", cadences: ["monthly"] },
  { key: "quarterly", label: "Quarterly", cadences: ["quarterly"] },
];

function CadenceBoard() {
  const bands = BANDS.map((b) => ({
    ...b,
    items: AGENTS.flatMap((a) =>
      a.duties.filter((d) => b.cadences.includes(d.cadence)).map((duty) => ({ duty, agent: a }))
    ),
  })).filter((b) => b.items.length > 0);
  const total = bands.reduce((s, b) => s + b.items.length, 0);

  return (
    <section className="af-glass" style={{ overflow: "hidden", marginBottom: 24 }}>
      <div
        style={{
          padding: "16px 22px 14px",
          display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
          background: "rgba(255,255,255,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h3 className="af-display" style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}>
            What this team ships
          </h3>
          <span style={{ fontSize: 12, color: "var(--af-text-mute)" }}>{total} standing deliverables</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--af-text-mute)" }}>the whole cadence, agent by agent</span>
      </div>
      {bands.map((band) => (
        <div key={band.key} className="af-cadence-band">
          <div style={{ paddingTop: 3 }}>
            <div className="af-eyebrow" style={{ fontSize: 10 }}>{band.label}</div>
            <div className="af-num" style={{ fontSize: 11, color: "var(--af-text-faint)", marginTop: 2 }}>
              {band.items.length}
            </div>
          </div>
          <div className="af-cadence-grid">
            {band.items.map(({ duty, agent }, i) => (
              <span
                key={`${agent.id}-${i}`}
                title={duty.detail ? `${agent.name}: ${duty.detail}` : agent.name}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", minWidth: 0 }}
              >
                <Avatar initials={agent.initials} bg={agent.bg} size="xs" />
                <span style={{ fontSize: 13, color: "var(--af-ink)", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {duty.label}
                </span>
                {duty.cadence === "live" && (
                  <span
                    title="runs intraday"
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f766e", flexShrink: 0 }}
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ─── Departments & agent rows ─────────────── */

function Department({
  dept,
  agents,
  directReports,
  defaultExpanded,
  workingOn,
  onAction,
}: {
  dept: string;
  agents: DemoAgent[];
  directReports?: boolean;
  defaultExpanded?: string;
  workingOn: Map<string, string>;
  onAction: (text: string) => void;
}) {
  const manager = agents.find((a) => a.isManager);
  const reports = agents.filter((a) => !a.isManager);

  return (
    <div className="af-glass" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "16px 22px",
          display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          borderBottom: "1px solid var(--af-line)",
          background: "rgba(255,255,255,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h3 className="af-display" style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}>{dept}</h3>
          <span style={{ fontSize: 12, color: "var(--af-text-mute)" }}>{agents.length} agent{agents.length === 1 ? "" : "s"}</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--af-text-mute)" }}>
          {manager ? <><span className="af-mono">{manager.name}</span> manages {reports.length}</> : "reports to you"}
        </span>
      </div>
      {manager && (
        <>
          <AgentRow agent={manager} isManager workingOn={workingOn} defaultExpanded={defaultExpanded === manager.id} onAction={onAction} />
          <hr className="af-hr" />
        </>
      )}
      {reports.map((a, i) => (
        <div key={a.id}>
          <AgentRow
            agent={a}
            indented={!directReports && !!manager}
            workingOn={workingOn}
            defaultExpanded={defaultExpanded === a.id}
            onAction={onAction}
          />
          {i < reports.length - 1 && <hr className="af-hr" />}
        </div>
      ))}
    </div>
  );
}

function AgentRow({
  agent,
  isManager,
  indented,
  defaultExpanded,
  workingOn,
  onAction,
}: {
  agent: DemoAgent;
  isManager?: boolean;
  indented?: boolean;
  defaultExpanded?: boolean;
  workingOn: Map<string, string>;
  onAction: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  const line = workingOn.get(agent.id) ?? agent.workingOn;

  return (
    <>
      <button
        className={`af-agent-row${expanded ? " is-open" : ""}${indented ? " is-indented" : ""}`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {indented && (
          <svg className="af-row-elbow" preserveAspectRatio="none" aria-hidden>
            <path d="M 4 0 L 4 32 Q 4 36 8 36 L 22 36" stroke="rgba(15,23,42,0.18)" strokeWidth="1" fill="none" strokeDasharray="2,2" />
          </svg>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Avatar initials={agent.initials} bg={agent.bg} size="md" status={agent.status} />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</span>
              {isManager && <Tag style={{ height: 16, fontSize: 9, padding: "0 6px" }}>MGR</Tag>}
            </span>
            <span style={{ display: "block", fontSize: 12, color: "var(--af-text-mute)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {agent.role}
            </span>
          </span>
        </span>

        <span className="af-col-working" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <StatusDot status={agent.status} />
          <span style={{ fontSize: 13, color: "var(--af-ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {line}
          </span>
        </span>

        <span className="af-col-tasks">
          <span className="af-eyebrow" style={{ display: "block", fontSize: 10 }}>Tasks/wk</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span className="af-num" style={{ fontWeight: 600, fontSize: 14 }}>{agent.tasksWk}</span>
            {agent.trend.length > 1 && <Spark data={agent.trend} width={30} height={14} />}
          </span>
        </span>

        <span style={{ display: "flex", justifyContent: "flex-end" }}>
          {agent.reviewCount > 0 ? (
            <Tag variant="amber">⚑ {agent.reviewCount} review{agent.reviewCount === 1 ? "" : "s"}</Tag>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--af-text-mute)", whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0f766e", display: "inline-block" }} />
              On track
            </span>
          )}
        </span>

        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 240ms cubic-bezier(0.2, 0.7, 0.3, 1)",
            color: expanded ? "var(--af-ink)" : "var(--af-text-faint)",
          }}
          aria-hidden
        >
          <path d="M4 6 L8 10 L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && <ExpandedPanel agent={agent} onAction={onAction} />}
    </>
  );
}

const KPI_TONE: Record<string, string> = {
  good: "#0f766e",
  warn: "#b45309",
  mute: "var(--af-text-mute)",
};

function ExpandedPanel({ agent, onAction }: { agent: DemoAgent; onAction: (text: string) => void }) {
  const cadenceOrder: Cadence[] = ["live", "daily", "weekly", "monthly", "quarterly"];
  const cadenceLabel: Record<Cadence, string> = { live: "Live", daily: "Daily", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" };
  const groups = cadenceOrder
    .map((c) => ({ cadence: c, items: agent.duties.filter((d) => d.cadence === c) }))
    .filter((g) => g.items.length > 0);

  return (
    <div style={{ padding: "4px 22px 22px", background: "rgba(255,255,255,0.20)", borderTop: "1px solid var(--af-line)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, padding: "14px 0 16px", flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--af-ink-soft)", maxWidth: 620, lineHeight: 1.55 }}>{agent.bio}</p>
        <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            className="af-btn af-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction(`${agent.name} did not actually run. In the live hub this kicks off one of ${agent.name}'s preset jobs immediately.`);
            }}
          >
            Run now
          </button>
          <button
            className="af-btn af-btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onAction(`${agent.name} was not paused. In the live hub this takes the agent off its schedule until you resume it.`);
            }}
          >
            Pause
          </button>
        </span>
      </div>

      {groups.length > 0 && (
        <div className="af-glass-thin" style={{ padding: "10px 16px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: "6px 26px", alignItems: "baseline" }}>
          {groups.map((g) => (
            <div key={g.cadence} style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
              <span className="af-eyebrow" style={{ fontSize: 10, whiteSpace: "nowrap" }}>{cadenceLabel[g.cadence]}</span>
              <span style={{ fontSize: 12.5, color: "var(--af-ink-soft)", lineHeight: 1.5 }}>
                {g.items.map((d, i) => (
                  <span key={i} title={d.detail}>
                    {i > 0 && <span style={{ color: "var(--af-text-faint)" }}>{" · "}</span>}
                    {d.label}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="af-glass-thin" style={{ padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${agent.kpis.length || 1}, 1fr)`, gap: 0 }}>
          {agent.kpis.map((k, i) => {
            const color = k.tone ? KPI_TONE[k.tone] : k.up ? "#0f766e" : "var(--af-text-mute)";
            return (
              <div
                key={i}
                style={{
                  paddingLeft: i === 0 ? 0 : 18,
                  paddingRight: i === agent.kpis.length - 1 ? 0 : 18,
                  borderRight: i < agent.kpis.length - 1 ? "1px solid var(--af-line)" : "none",
                  minWidth: 0,
                }}
              >
                <div className="af-eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>{k.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span className="af-display af-num" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1, color }}>{k.value}</span>
                  <span style={{ fontSize: 11, color }}>{k.up && "↑ "}{k.delta}</span>
                </div>
                {k.target && (
                  <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.3, color: "var(--af-text-mute)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {k.target}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="af-kanban">
        <MiniColumn title="To do" dot="#94a3b8" cards={agent.kanban.todo} />
        <MiniColumn title="Doing" dot="#0d9488" cards={agent.kanban.doing} />
        <MiniColumn title="Blocked" dot="#b91c1c" cards={agent.kanban.blocked} />
        <MiniColumn title="Review" dot="#b45309" cards={agent.kanban.review} />
        <MiniColumn title="Done" dot="#15803d" cards={agent.kanban.done} />
      </div>
    </div>
  );
}

function MiniColumn({ title, dot, cards }: { title: string; dot: string; cards: string[] }) {
  return (
    <div className="af-minicol">
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, display: "inline-block" }} />
        <span className="af-eyebrow" style={{ fontSize: 9.5 }}>{title}</span>
        <span className="af-num" style={{ fontSize: 10, color: "var(--af-text-faint)" }}>{cards.length}</span>
      </div>
      {cards.map((c, i) => (
        <div key={i} className="af-minicard">{c}</div>
      ))}
      {cards.length === 0 && (
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--af-text-faint)" }}>empty</div>
      )}
    </div>
  );
}

/* ─── Right rail ─────────────── */

function NeedsYou({ onOpen }: { onOpen: (text: string) => void }) {
  const urgent = HANDOFFS.filter((h) => h.urgent).length;
  return (
    <div className="af-glass" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--af-line)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          background: "rgba(254, 215, 170, 0.25)",
        }}
      >
        <span className="af-display" style={{ fontSize: 15, fontWeight: 500 }}>Needs you</span>
        <span style={{ fontSize: 11, color: "var(--af-text-mute)" }}>
          {HANDOFFS.length} · {urgent} urgent
        </span>
      </div>
      {HANDOFFS.map((h, i) => {
        const agent = byId.get(h.agentId);
        return (
          <button
            key={h.id}
            className="af-row-hover"
            onClick={() =>
              onOpen("In the live hub this opens the full handoff: the agent's reasoning, the numbers behind it, and an approve or reject action.")
            }
            style={{
              width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer",
              fontFamily: "var(--af-sans)",
              padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              borderBottom: i < HANDOFFS.length - 1 ? "1px solid var(--af-line)" : "none",
            }}
          >
            {agent && <Avatar initials={agent.initials} bg={agent.bg} size="sm" />}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 12, color: "var(--af-ink)", lineHeight: 1.35 }}>{h.title}</span>
              <span style={{ display: "block", fontSize: 10, color: "var(--af-text-mute)", marginTop: 2 }}>
                {agent?.name} · {h.ago} ago
              </span>
            </span>
            {h.urgent && <Tag variant="red" style={{ fontSize: 9, height: 18, padding: "0 6px" }}>urgent</Tag>}
          </button>
        );
      })}
    </div>
  );
}

function LiveFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="af-glass">
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--af-line)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
        }}
      >
        <span className="af-display" style={{ fontSize: 15, fontWeight: 500 }}>Live feed</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--af-text-mute)" }}>
          <StatusDot status="online" size={6} /> auto-refresh
        </span>
      </div>
      <div style={{ padding: "6px 6px 10px" }}>
        {items.map((it, i) => {
          const agent = byId.get(it.agentId);
          if (!agent) return null;
          return (
            <div key={it.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8 }}>
              <Avatar initials={agent.initials} bg={agent.bg} size="xs" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, lineHeight: 1.4, color: "var(--af-ink)" }}>
                  <span style={{ fontWeight: 600 }}>{agent.name}</span>{" "}
                  <span style={{ color: "var(--af-ink-soft)" }}>{it.what}</span>
                </div>
                <div className="af-mono" style={{ fontSize: 10, color: "var(--af-text-faint)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {it.live && i === 0 && (
                    <span
                      style={{
                        width: 5, height: 5, borderRadius: "50%", background: "#0d9488",
                        boxShadow: "0 0 0 3px rgba(13, 148, 136, 0.2)",
                        display: "inline-block",
                      }}
                    />
                  )}
                  {FEED_AGES[i] ?? "1h"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Activity() {
  const sorted = [...AGENTS].sort((a, b) => b.tasksWk - a.tasksWk).filter((a) => a.tasksWk > 0);
  const max = Math.max(...sorted.map((a) => a.tasksWk));
  return (
    <div className="af-glass">
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--af-line)",
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
        }}
      >
        <span className="af-display" style={{ fontSize: 15, fontWeight: 500 }}>Activity (7d)</span>
        <span className="af-display af-num" style={{ fontSize: 17, fontWeight: 500 }}>{TOTALS.tasksThisWeek}</span>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={a.initials} bg={a.bg} size="xs" />
            <span style={{ fontSize: 12, width: 64, color: "var(--af-ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.name}
            </span>
            <span style={{ flex: 1, height: 6, background: "rgba(15,23,42,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${(a.tasksWk / max) * 100}%`, background: a.bg, borderRadius: 3 }} />
            </span>
            <span className="af-num" style={{ fontSize: 11, color: "var(--af-text-mute)", width: 24, textAlign: "right" }}>
              {a.tasksWk}
            </span>
          </div>
        ))}
        <div style={{ fontSize: 10, color: "var(--af-text-faint)", marginTop: 4, lineHeight: 1.4 }}>
          Cost in $ will replace this once token tracking is wired.
        </div>
      </div>
    </div>
  );
}
