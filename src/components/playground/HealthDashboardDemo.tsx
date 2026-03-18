"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, MousePointer2, Sparkles } from "lucide-react";
import {
  type ShowcasePhase,
  getShowcaseLoopDuration,
  getShowcaseTimeline,
} from "./portfolioShowcaseTimeline";

const PHOTO = "https://habit.alexanderwp.com/assets/athlete-avatar-CswwWmKv.png";
const EASE = "cubic-bezier(0.2, 0, 0, 1)";

/* ---- Warm light palette (matches habit.alexanderwp.com) ---- */
const P = {
  bg: "#f5efe6",
  bgCard: "#faf6f0",
  bgGlass: "rgba(255,252,247,0.7)",
  bgGlassHover: "rgba(255,252,247,0.85)",
  stroke: "rgba(180,160,130,0.18)",
  strokeHover: "rgba(180,160,130,0.28)",
  text: "#2a2520",
  textSecondary: "#6b6058",
  textTertiary: "#a89e92",
  accent: "#f0a05e",
  accentSoft: "rgba(240,160,94,0.12)",
  green: "rgba(72,160,110,0.85)",
  greenSoft: "rgba(72,160,110,0.1)",
  greenBorder: "rgba(72,160,110,0.22)",
  gradientWarm: "linear-gradient(135deg, rgba(245,200,140,0.25), rgba(255,220,180,0.1), transparent 60%)",
  gradientGold: "linear-gradient(90deg, rgba(220,180,130,0.5), rgba(240,160,94,0.35))",
};

interface Props {
  isVisible: boolean;
}

export function HealthDashboardDemo({ isVisible }: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [phase, setPhase] = useState<ShowcasePhase>("landing");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const timeline = useMemo(() => getShowcaseTimeline(reducedMotion), [reducedMotion]);
  const loopDuration = useMemo(() => getShowcaseLoopDuration(reducedMotion), [reducedMotion]);

  useEffect(() => {
    if (!isVisible) { setPhase("landing"); return; }
    const timers = timeline.map((s) => window.setTimeout(() => setPhase(s.phase), s.at));
    const loop = window.setTimeout(() => setCycle((v) => v + 1), loopDuration);
    return () => { timers.forEach(clearTimeout); clearTimeout(loop); };
  }, [isVisible, cycle, loopDuration, timeline]);

  const step = useMemo(() => timeline.find((s) => s.phase === phase) ?? timeline[0], [phase, timeline]);

  const showDashboard = phase !== "landing" && phase !== "cta-click";
  const showHabits = phase === "habits-nav-click" || phase === "habit-complete" || phase === "idle-before-loop";
  const showCelebration = phase === "habit-complete" || phase === "idle-before-loop";
  const showHeadline = phase === "dashboard" || phase === "habits-nav-click";

  const landingStyle: CSSProperties = {
    position: "absolute", inset: "clamp(16px, 2vw, 22px)",
    opacity: showDashboard ? 0 : 1,
    transform: showDashboard ? "translateY(-6px) scale(0.99)" : "translateY(0) scale(1)",
    filter: showDashboard ? "blur(4px)" : "blur(0)",
    transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}, filter 520ms ${EASE}`,
    pointerEvents: showDashboard ? "none" : "auto",
  };

  const dashboardStyle: CSSProperties = {
    position: "absolute", inset: "clamp(16px, 2vw, 22px)",
    opacity: showDashboard ? 1 : 0,
    transform: showDashboard ? "translateY(0) scale(1)" : "translateY(8px) scale(0.994)",
    filter: showDashboard ? "blur(0)" : "blur(4px)",
    transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}, filter 520ms ${EASE}`,
    pointerEvents: showDashboard ? "auto" : "none",
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Shell */}
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: 16,
        background: P.bg,
        border: `1px solid ${P.stroke}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(120,100,70,0.06)",
      }}>
        {/* Warm gradient overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `radial-gradient(ellipse 120% 80% at 0% 0%, rgba(245,200,140,0.18), transparent 50%),
            radial-gradient(ellipse 80% 60% at 100% 20%, rgba(255,190,140,0.10), transparent 45%)`,
        }} />

        {/* Browser bar */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center",
          gap: 12, padding: "12px 16px",
          borderBottom: `1px solid ${P.stroke}`, background: "rgba(255,252,247,0.6)",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#f0a05e", P.textTertiary, P.textTertiary].map((c, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: 999, background: c, opacity: i === 0 ? 0.7 : 0.2 }} />
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: P.textTertiary }}>
            habit.alexanderwp.com
          </div>
          <div style={{
            fontSize: 10, color: P.textTertiary, padding: "4px 8px", borderRadius: 999,
            background: "rgba(240,160,94,0.06)", border: `1px solid ${P.stroke}`,
            fontFamily: "var(--font-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Autoplay
          </div>
        </div>

        {/* Stage */}
        <div style={{ position: "relative", zIndex: 1, minHeight: "clamp(420px, 52vw, 580px)", padding: "clamp(16px, 2vw, 22px)" }}>

          {/* === Landing Scene === */}
          <div style={landingStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)", gap: "clamp(16px, 2.4vw, 28px)", alignItems: "center", height: "100%" }}>
              {/* Copy */}
              <div style={{ maxWidth: "32rem" }}>
                <Kicker>Portfolio Snapshot</Kicker>
                <h2 style={{ marginTop: 12, fontSize: "clamp(24px, 3.2vw, 42px)", lineHeight: 0.98, letterSpacing: "-0.05em", color: P.text }}>
                  Your health in one place.<br />Played daily.
                </h2>
                <p style={{ marginTop: 14, maxWidth: "40ch", fontSize: 13, lineHeight: 1.6, color: P.textSecondary }}>
                  Connect your apps, build your athlete card, and keep momentum alive through habits that move your score.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 14px", marginTop: 18 }}>
                  <button type="button" tabIndex={-1} style={{
                    padding: "10px 18px", borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: "default",
                    background: P.accent, color: "#fff",
                    border: "none",
                    boxShadow: "0 2px 8px rgba(240,160,94,0.3), 0 12px 22px rgba(240,160,94,0.12)",
                    transform: phase === "cta-click" ? "scale(0.985)" : "scale(1)",
                    transition: `transform 200ms ${EASE}`,
                  }}>
                    Open app
                  </button>
                  <span style={{ fontSize: 11, color: P.textTertiary, fontFamily: "var(--font-mono), monospace" }}>
                    Small embed. Real product feel.
                  </span>
                </div>
              </div>

              {/* Cards visual */}
              <div style={{ position: "relative", minHeight: "clamp(300px, 36vw, 440px)" }}>
                <div style={{
                  position: "absolute", inset: 0, zIndex: 1,
                  opacity: showDashboard ? 0.58 : 1,
                  transform: showDashboard ? "translateY(-18px) scale(0.984)" : "translateY(0)",
                  filter: showDashboard ? "blur(1px)" : "blur(0)",
                  transition: `transform 560ms ${EASE}, opacity 520ms ${EASE}, filter 520ms ${EASE}`,
                }}>
                  <HealthCardMock />
                </div>
                <div style={{
                  position: "absolute", inset: 0, zIndex: 2,
                  transform: showDashboard ? "translateY(14px) scale(0.94)" : "translateY(60px) scale(0.94)",
                  opacity: showDashboard ? 0 : 1,
                  filter: showDashboard ? "blur(3px)" : "blur(0)",
                  transition: `transform 560ms ${EASE}, opacity 520ms ${EASE}, filter 520ms ${EASE}`,
                }}>
                  <AthleteCardMock />
                </div>
              </div>
            </div>
          </div>

          {/* === Dashboard Scene === */}
          <div style={dashboardStyle}>
            <div style={{
              height: "100%", borderRadius: 20, padding: "clamp(16px, 2vw, 22px)",
              background: P.bgCard,
              border: `1px solid ${P.stroke}`,
              boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(120,100,70,0.05)",
            }}>
              {/* Top bar */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                <div>
                  <Kicker>HealthOS</Kicker>
                  <div style={{ marginTop: 6, fontSize: "clamp(20px, 2.4vw, 28px)", lineHeight: 1.02, letterSpacing: "-0.04em", color: P.text }}>Overview</div>
                </div>
                <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 999, background: P.bgGlass, border: `1px solid ${P.stroke}` }}>
                  <Tab active={!showHabits}>Dashboard</Tab>
                  <Tab active={showHabits}>Habits</Tab>
                </div>
              </div>

              {/* Headline pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16,
                padding: "8px 12px", borderRadius: 999, fontSize: 12,
                color: P.text, background: P.accentSoft, border: `1px solid ${P.stroke}`,
                opacity: showHeadline ? 1 : 0, transform: showHeadline ? "translateY(0)" : "translateY(4px)",
                transition: `opacity 320ms ${EASE}, transform 320ms ${EASE}`,
              }}>
                <Sparkles style={{ width: 14, height: 14, color: P.accent }} />
                <span>All your health data in one dashboard</span>
              </div>

              {/* Content area */}
              <div style={{ position: "relative", marginTop: 18, minHeight: "clamp(260px, 30vw, 380px)" }}>
                {/* Dashboard view */}
                <div style={{
                  position: "absolute", inset: 0,
                  opacity: showHabits ? 0 : 1,
                  transform: showHabits ? "translateX(-12px)" : "translateX(0)",
                  filter: showHabits ? "blur(1.5px)" : "blur(0)",
                  transition: `opacity 420ms ${EASE}, transform 420ms ${EASE}, filter 420ms ${EASE}`,
                }}>
                  {/* Hero */}
                  <GlassInner style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 16, alignItems: "flex-end", padding: 16 }}>
                    <div>
                      <Kicker>Athlete card</Kicker>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 12 }}>
                        <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: P.textTertiary, fontFamily: "var(--font-mono), monospace" }}>OVR</span>
                        <strong style={{ fontSize: "clamp(36px, 3.6vw, 52px)", lineHeight: 0.9, letterSpacing: "-0.06em", fontWeight: 650, color: P.text }}>83</strong>
                      </div>
                      <p style={{ marginTop: 8, maxWidth: "22rem", fontSize: 12, lineHeight: 1.6, color: P.textSecondary }}>
                        Sleep, training, and nutrition roll into one calm daily read.
                      </p>
                    </div>
                    <div style={{ width: "clamp(100px, 14vw, 150px)", aspectRatio: "0.82", overflow: "hidden", borderRadius: 18, border: `1px solid ${P.stroke}`, background: P.bgGlass }}>
                      <img src={PHOTO} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  </GlassInner>

                  {/* Metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 10 }}>
                    <MetricCard label="Sleep" value="7h 42m" meta="+18m vs avg" />
                    <MetricCard label="Recovery" value="82" meta="ready to train" />
                    <MetricCard label="Protein" value="126g" meta="on target" />
                    <MetricCard label="Steps" value="10,284" meta="steady output" />
                  </div>
                </div>

                {/* Habits view */}
                <div style={{
                  position: "absolute", inset: 0,
                  opacity: showHabits ? 1 : 0,
                  transform: showHabits ? "translateX(0)" : "translateX(12px)",
                  filter: showHabits ? "blur(0)" : "blur(1.5px)",
                  transition: `opacity 420ms ${EASE}, transform 420ms ${EASE}, filter 420ms ${EASE}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-end" }}>
                    <div>
                      <Kicker>Habits</Kicker>
                      <div style={{ marginTop: 6, fontSize: "clamp(20px, 2.4vw, 28px)", lineHeight: 1.02, letterSpacing: "-0.04em", color: P.text }}>Today&apos;s wins</div>
                    </div>
                    <div style={{ fontSize: 11, color: P.textSecondary, padding: "6px 10px", borderRadius: 999, background: P.bgGlass, border: `1px solid ${P.stroke}`, fontFamily: "var(--font-mono), monospace" }}>
                      3/3 locked in
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                    <HabitRow label="Protein with lunch" points={10} done={showCelebration} />
                    <HabitRow label="Walk 20 min" points={10} done />
                    <HabitRow label="In bed by 11" points={10} done />
                  </div>

                  <GlassInner style={{ marginTop: 14, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: P.textSecondary }}>
                      <span>Consistency</span><span>100%</span>
                    </div>
                    <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: "rgba(180,160,130,0.12)", overflow: "hidden" }}>
                      <div style={{
                        width: showCelebration ? "100%" : "44%", height: "100%", borderRadius: "inherit",
                        background: P.gradientGold,
                        transition: `width 600ms ${EASE}`,
                      }} />
                    </div>
                  </GlassInner>

                  {/* Success badge */}
                  <div style={{
                    position: "absolute", left: 16, bottom: 16,
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px",
                    borderRadius: 999, fontSize: 12, color: "#2d5a3f",
                    background: P.greenSoft, border: `1px solid ${P.greenBorder}`,
                    boxShadow: "0 4px 12px rgba(72,160,110,0.08)",
                    opacity: showCelebration ? 1 : 0,
                    transform: showCelebration ? "translateY(0)" : "translateY(4px)",
                    transition: `opacity 280ms ${EASE}, transform 280ms ${EASE}`,
                  }}>
                    <Check style={{ width: 14, height: 14 }} />
                    <span>Nice. You did it.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cursor */}
          {!reducedMotion && step?.cursor.visible && (
            <div style={{
              position: "absolute", left: `${step.cursor.x}%`, top: `${step.cursor.y}%`,
              zIndex: 4, pointerEvents: "none",
              transform: step.cursor.pressing ? "translate(-50%,-50%) scale(0.98)" : "translate(-50%,-50%)",
              transition: `left 880ms ${EASE}, top 880ms ${EASE}, transform 220ms ${EASE}`,
            }}>
              <MousePointer2 style={{ width: 22, height: 22, color: P.text, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.12))" }} />
              {step.cursor.pressing && (
                <span style={{
                  position: "absolute", left: 2, top: 2, width: 20, height: 20, borderRadius: 999,
                  background: `radial-gradient(circle, ${P.accentSoft}, transparent 70%)`,
                }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Shared tiny components ---- */

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, lineHeight: 1.1, letterSpacing: "0.16em", textTransform: "uppercase", color: P.textTertiary, fontWeight: 600, fontFamily: "var(--font-mono), monospace" }}>
      {children}
    </div>
  );
}

function Tab({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span style={{
      padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      fontFamily: "var(--font-mono), monospace", letterSpacing: "0.06em",
      color: active ? P.text : P.textTertiary,
      background: active ? "rgba(240,160,94,0.12)" : "transparent",
      transition: `background 220ms ${EASE}, color 220ms ${EASE}`,
    }}>
      {children}
    </span>
  );
}

function GlassInner({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: P.bgGlass, border: `1px solid ${P.stroke}`, borderRadius: 18, ...style }}>
      {children}
    </div>
  );
}

function MetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <GlassInner style={{ padding: 12, minHeight: 100 }}>
      <Kicker>{label}</Kicker>
      <div style={{ marginTop: 12, fontSize: "clamp(18px, 2vw, 26px)", lineHeight: 1, letterSpacing: "-0.04em", fontWeight: 620, color: P.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.5, color: P.textSecondary }}>{meta}</div>
    </GlassInner>
  );
}

function HabitRow({ label, points, done }: { label: string; points: number; done: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center",
      padding: "12px 14px", borderRadius: 14,
      background: done ? P.greenSoft : P.bgGlass,
      border: `1px solid ${done ? P.greenBorder : P.stroke}`,
      transition: `background 260ms ${EASE}, border-color 260ms ${EASE}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: P.text, fontSize: 13 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${done ? P.greenBorder : P.stroke}`,
          background: done ? P.greenSoft : "transparent",
          color: done ? P.green : "transparent",
          transition: `background 260ms ${EASE}, color 260ms ${EASE}, border-color 260ms ${EASE}`,
        }}>
          {done && <Check style={{ width: 14, height: 14 }} />}
        </div>
        <span>{label}</span>
      </div>
      <span style={{ fontSize: 10, color: P.textTertiary, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-mono), monospace" }}>+{points} XP</span>
    </div>
  );
}

/* ---- Card mocks for landing scene ---- */

function HealthCardMock() {
  return (
    <div style={{
      overflow: "hidden", position: "relative", borderRadius: 22, padding: 20,
      background: P.bgCard, border: `1px solid ${P.stroke}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 20px rgba(120,100,70,0.05)",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: P.gradientWarm, opacity: 0.8 }} />

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: P.accent, opacity: 0.5 }} />
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: P.textTertiary }}>Health Card</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: P.text }}>Today</div>
          </div>
        </div>
        <GlassInner style={{ padding: "4px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: P.textSecondary, fontVariantNumeric: "tabular-nums" }}>Streak 12</span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: P.accent, opacity: 0.4 }} />
        </GlassInner>
      </div>

      <div style={{ position: "relative", marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[{ l: "Sleep", v: "7h 42m", m: "+18m" }, { l: "Activity", v: "10,284", m: "steps" }, { l: "Nutrition", v: "126g", m: "protein" }].map((d) => (
          <GlassInner key={d.l} style={{ padding: 10, borderRadius: 14 }}>
            <div style={{ fontSize: 10, color: P.textTertiary, letterSpacing: "0.14em", textTransform: "uppercase" }}>{d.l}</div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: P.text, fontVariantNumeric: "tabular-nums" }}>{d.v}</div>
            <div style={{ fontSize: 10, color: P.textSecondary }}>{d.m}</div>
          </GlassInner>
        ))}
      </div>

      <GlassInner style={{ position: "relative", marginTop: 14, padding: 14, borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: P.textTertiary }}>Habits</span>
          <span style={{ fontSize: 11, color: P.textSecondary, fontVariantNumeric: "tabular-nums" }}>+30 XP</span>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {["Walk 20 min", "Protein with lunch"].map((h) => (
            <MiniHabit key={h} done label={h} />
          ))}
          <MiniHabit done={false} label="In bed by 11" />
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.stroke}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: P.textSecondary }}>OVR</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: P.text, fontVariantNumeric: "tabular-nums" }}>72</span>
        </div>
      </GlassInner>

      <div style={{ position: "relative", marginTop: 14, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: P.textTertiary }}>Connect apps. Tap habits.</span>
        <span style={{ fontSize: 11, color: P.textSecondary, fontVariantNumeric: "tabular-nums" }}>2 min/day</span>
      </div>
    </div>
  );
}

function AthleteCardMock() {
  return (
    <div style={{
      overflow: "hidden", position: "relative", borderRadius: 22, padding: 20,
      background: P.bgCard, border: `1px solid ${P.stroke}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 20px rgba(120,100,70,0.05)",
    }}>
      <div style={{ position: "absolute", inset: -10, pointerEvents: "none", opacity: 0.6, background: "radial-gradient(ellipse at 30% 20%, rgba(240,180,120,0.15), transparent 60%)" }} />

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 14 }}>
        {/* Portrait */}
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: `1px solid ${P.stroke}`, background: P.bgGlass, minHeight: 200 }}>
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, display: "flex", gap: 6, alignItems: "flex-start" }}>
            <div style={{ borderRadius: 10, border: `1px solid ${P.stroke}`, padding: "6px 10px", background: "rgba(255,252,247,0.85)", backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: P.textTertiary }}>OVR</div>
              <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 600, letterSpacing: "-0.04em", color: P.accent, fontVariantNumeric: "tabular-nums" }}>83</div>
            </div>
            <span style={{ fontSize: 10, padding: "4px 8px", borderRadius: 999, fontWeight: 500, color: P.green, background: P.greenSoft, border: `1px solid ${P.greenBorder}` }}>Trending up</span>
          </div>
          <img src={PHOTO} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.06) contrast(1.04)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
            <div style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", padding: "8px 10px", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>Athlete Card</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, color: "rgba(255,255,255,0.9)" }}>Alexander</div>
            </div>
          </div>
        </div>

        {/* Traits */}
        <div style={{ borderRadius: 18, padding: 14, background: P.bgGlass, border: `1px solid ${P.stroke}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[{ l: "Height", v: "175 cm" }, { l: "Weight", v: "72 kg" }, { l: "Age", v: "22" }].map((d) => (
              <div key={d.l} style={{ borderRadius: 10, border: `1px solid ${P.stroke}`, background: P.bgCard, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: P.textTertiary }}>{d.l}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: P.text, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{d.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {[{ l: "Sleep", v: 78 }, { l: "Training", v: 70 }, { l: "Nutrition", v: 66 }].map((d) => (
              <div key={d.l}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: P.textSecondary }}>
                  <span>{d.l}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{d.v}</span>
                </div>
                <div style={{ marginTop: 4, height: 6, borderRadius: 999, background: "rgba(180,160,130,0.12)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: "inherit", width: `${d.v}%`, background: P.gradientGold }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: P.textTertiary }}>Your card moves when you keep your habits.</div>
        </div>
      </div>
    </div>
  );
}

function MiniHabit({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "6px 10px", borderRadius: 10, background: P.bgGlass, border: `1px solid ${P.stroke}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 18, height: 18, borderRadius: 6, border: `1px solid ${done ? P.greenBorder : P.stroke}`, background: done ? P.greenSoft : "transparent" }} />
        <span style={{ fontSize: 11, color: P.textSecondary }}>{label}</span>
      </div>
    </div>
  );
}
