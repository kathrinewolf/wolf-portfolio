"use client";

import { useRef, useState, type CSSProperties } from "react";
import { motion, useInView } from "framer-motion";

/* ───────── Constants ───────── */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Domain = "growth" | "ai" | "psychology" | "execution";

const DOMAIN_TINTS: Record<Domain, string> = {
  growth:     "rgba(200, 220, 255, 0.85)",
  ai:         "rgba(180, 200, 255, 0.9)",
  psychology: "rgba(255, 210, 200, 0.85)",
  execution:  "rgba(210, 255, 210, 0.85)",
};

interface Skill {
  label: string;
  domain: Domain;
  size: number;
  x: string;
  y: string;
}

const SKILLS: Skill[] = [
  { label: "Marketing Strategy",  domain: "growth",     size: 28, x: "8%",  y: "12%" },
  { label: "Paid Ads",            domain: "growth",     size: 22, x: "2%",  y: "42%" },
  { label: "Growth Marketing",    domain: "growth",     size: 16, x: "12%", y: "72%" },
  { label: "Funnel Architecture", domain: "growth",     size: 14, x: "5%",  y: "90%" },
  { label: "AI Agents",           domain: "ai",         size: 26, x: "38%", y: "5%" },
  { label: "Prompt Engineering",  domain: "ai",         size: 18, x: "48%", y: "32%" },
  { label: "Automation",          domain: "ai",         size: 20, x: "32%", y: "55%" },
  { label: "Vibe-coding",         domain: "ai",         size: 16, x: "42%", y: "78%" },
  { label: "UX Psychology",       domain: "psychology",  size: 24, x: "68%", y: "8%" },
  { label: "Copywriting",         domain: "psychology",  size: 20, x: "75%", y: "38%" },
  { label: "Data Storytelling",   domain: "psychology",  size: 14, x: "62%", y: "62%" },
  { label: "CRO",                 domain: "execution",  size: 22, x: "85%", y: "18%" },
  { label: "Analytics",           domain: "execution",  size: 18, x: "78%", y: "55%" },
  { label: "Creative Direction",  domain: "execution",  size: 15, x: "88%", y: "80%" },
];

const DOMAIN_LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3],
  [4, 5], [5, 6], [6, 7],
  [8, 9], [9, 10],
  [11, 12], [12, 13],
  [0, 4], [5, 8], [9, 11],
];

const STRATEGIST_LINES = [
  "Pattern recognition across industries",
  "Psychology-informed positioning",
  "Growth architecture",
  "Long-game thinking",
];

const BUILDER_LINES = [
  "AI-augmented execution",
  "Vibe-coding prototypes overnight",
  "Automation-first workflows",
  "Move fast, learn faster",
];

/* ───────── Component ───────── */

export function Craft() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <HeaderMission />
      <SectionEdge />
      <SectionIntersection />
      <SectionDualNature />
      <SectionConstellation />
      <SectionClosing />
    </div>
  );
}

/* ───────── Header + Mission (leads the page) ───────── */

function HeaderMission() {
  return (
    <div style={{ marginBottom: 64 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: 16,
        }}
      >
        Craft
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="gradient-text"
        style={{
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 600,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          marginBottom: 16,
        }}
      >
        Growing companies that make people&apos;s lives better.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          maxWidth: 520,
          marginBottom: 28,
        }}
      >
        Health, personal growth, sports, performance. Companies where the
        product actually matters and the mission goes beyond the bottom line.
        That&apos;s what gets me out of bed.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
      >
        <StatChip label="Focus" value="Health & Performance" />
        <StatChip label="Approach" value="Data-driven, human-first" />
        <StatChip label="Execution" value="AI-augmented" />
      </motion.div>
    </div>
  );
}

/* ───────── The Edge — why this combination matters ───────── */

function SectionEdge() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} style={{ marginBottom: 96 }}>
      <FadeIn visible={inView}>
        <SectionLabel>The Edge</SectionLabel>
      </FadeIn>

      <FadeIn visible={inView} delay={0.1}>
        <h3
          style={{
            fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: 24,
          }}
        >
          Data-driven. Human-first.
        </h3>
      </FadeIn>

      <FadeIn visible={inView} delay={0.2}>
        <div style={{ maxWidth: 580, display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={edgeBodyStyle}>
            Marketing loves data. And data is powerful. But behind every click,
            every conversion, every bounce is a real person making an irrational,
            emotional decision.
          </p>
          <p style={edgeBodyStyle}>
            Most teams pick a lane. The analytics people optimize metrics until
            the brand is nothing but discount codes and urgency tactics. The
            creative people build beautiful things nobody can measure. Both get
            stuck.
          </p>
        </div>
      </FadeIn>

      {/* Pullout quote */}
      <FadeIn visible={inView} delay={0.35}>
        <div
          style={{
            margin: "32px 0",
            padding: "24px 28px",
            borderLeft: "3px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "0 12px 12px 0",
          }}
        >
          <p
            style={{
              fontSize: "clamp(17px, 2.2vw, 21px)",
              fontWeight: 500,
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            I use data to find the patterns, then psychology to understand
            why they exist. That&apos;s how you grow without burning down
            the brand to get there.
          </p>
        </div>
      </FadeIn>

      <FadeIn visible={inView} delay={0.45}>
        <div style={{ maxWidth: 580 }}>
          <p style={edgeBodyStyle}>
            Think of it as equal parts analytical and humanistic. Numbers tell
            you what happened. Understanding people tells you why. When you
            connect those two, you build experiences that scale and that people
            actually trust. That&apos;s the combination I bring.
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

/* ───────── The Intersection (Venn) ───────── */

const CIRCLES = [
  {
    label: "Psychology",
    color: "rgba(255, 180, 160, 0.06)",
    border: "rgba(255, 180, 160, 0.12)",
    left: "calc(50% - 170px)",
    top: "calc(50% - 100px)",
    labelPos: { left: "calc(50% - 260px)", top: "calc(50% - 120px)" } as CSSProperties,
  },
  {
    label: "Data & Tech",
    color: "rgba(160, 180, 255, 0.06)",
    border: "rgba(160, 180, 255, 0.12)",
    left: "calc(50% + 10px)",
    top: "calc(50% - 100px)",
    labelPos: { right: "calc(50% - 260px)", top: "calc(50% - 120px)" } as CSSProperties,
  },
  {
    label: "Marketing",
    color: "rgba(180, 255, 200, 0.06)",
    border: "rgba(180, 255, 200, 0.12)",
    left: "calc(50% - 80px)",
    top: "calc(50% + 10px)",
    labelPos: { left: "calc(50% - 40px)", bottom: "0px" } as CSSProperties,
  },
];

function SectionIntersection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} style={{ marginBottom: 96 }}>
      <FadeIn visible={inView}>
        <SectionLabel>Where it all meets</SectionLabel>
      </FadeIn>

      <div
        style={{
          position: "relative",
          height: 340,
          marginTop: 24,
        }}
      >
        {CIRCLES.map((circle, i) => (
          <motion.div
            key={circle.label}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              inView
                ? { opacity: 1, scale: [0.6, 1.04, 1] }
                : {}
            }
            transition={{
              duration: 0.8,
              delay: i * 0.2,
              ease: "easeOut",
              scale: {
                duration: 4,
                delay: i * 0.2 + 0.8,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                times: [0, 0.5, 1],
              },
            }}
            style={{
              position: "absolute",
              left: circle.left,
              top: circle.top,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${circle.color} 0%, transparent 70%)`,
              border: `1px solid ${circle.border}`,
            }}
          />
        ))}

        {CIRCLES.map((circle, i) => (
          <motion.span
            key={`label-${circle.label}`}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 0.5 } : {}}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.15 }}
            style={{
              position: "absolute",
              ...circle.labelPos,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              whiteSpace: "nowrap",
            }}
          >
            {circle.label}
          </motion.span>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.0 }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <span
            className="gradient-text"
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            The bridge
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── Dual Nature ───────── */

function SectionDualNature() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} style={{ marginBottom: 96 }}>
      <FadeIn visible={inView}>
        <SectionLabel>How I work</SectionLabel>
      </FadeIn>

      <FadeIn visible={inView} delay={0.15}>
        <div
          className="dual-nature-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1px 1fr",
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--stroke)",
            overflow: "hidden",
            marginTop: 24,
          }}
        >
          <div style={{ padding: "32px 28px" }}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div style={dualLabelStyle}>The Strategist</div>
              <p style={dualHeadingStyle}>See the whole board.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STRATEGIST_LINES.map((line, i) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                    style={dualLineStyle}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="dual-nature-divider" style={{ background: "var(--stroke)" }} />

          <div style={{ padding: "32px 28px" }}>
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <div style={dualLabelStyle}>The Builder</div>
              <p style={dualHeadingStyle}>Ship before it&apos;s perfect.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {BUILDER_LINES.map((line, i) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: 8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.45 + i * 0.08 }}
                    style={dualLineStyle}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

/* ───────── Skill Constellation ───────── */

function SectionConstellation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [hoveredDomain, setHoveredDomain] = useState<Domain | null>(null);

  const getCenter = (skill: Skill) => ({
    cx: parseFloat(skill.x) + (skill.size > 20 ? 6 : 3),
    cy: parseFloat(skill.y) + 2,
  });

  return (
    <section ref={ref} style={{ marginBottom: 96 }}>
      <FadeIn visible={inView}>
        <SectionLabel>Skill Map</SectionLabel>
      </FadeIn>

      <FadeIn visible={inView} delay={0.1}>
        <p style={{ ...edgeBodyStyle, marginBottom: 24 }}>
          Hover to see how it all connects.
        </p>
      </FadeIn>

      <div
        style={{
          position: "relative",
          height: 400,
          marginTop: 16,
          borderRadius: 16,
          border: "1px solid var(--stroke)",
          background: "rgba(255,255,255,0.015)",
          overflow: "hidden",
        }}
      >
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {DOMAIN_LINKS.map(([a, b], i) => {
            const from = getCenter(SKILLS[a]);
            const to = getCenter(SKILLS[b]);
            const sameDomain = SKILLS[a].domain === SKILLS[b].domain;
            const isHighlighted =
              hoveredDomain &&
              (SKILLS[a].domain === hoveredDomain || SKILLS[b].domain === hoveredDomain);
            const isDimmed = hoveredDomain && !isHighlighted;

            return (
              <motion.line
                key={`line-${i}`}
                x1={`${from.cx}%`}
                y1={`${from.cy}%`}
                x2={`${to.cx}%`}
                y2={`${to.cy}%`}
                stroke={sameDomain ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}
                strokeWidth={sameDomain ? 1 : 0.5}
                strokeDasharray={sameDomain ? "none" : "4 4"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  inView
                    ? { pathLength: 1, opacity: isDimmed ? 0.15 : 1 }
                    : {}
                }
                transition={{
                  pathLength: { duration: 1.2, delay: 0.5 + i * 0.06 },
                  opacity: { duration: 0.3 },
                }}
              />
            );
          })}
        </svg>

        {SKILLS.map((skill, i) => {
          const isActive = !hoveredDomain || skill.domain === hoveredDomain;
          return (
            <motion.span
              key={skill.label}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                inView
                  ? { opacity: isActive ? 1 : 0.15, scale: [0, 1.1, 1] }
                  : {}
              }
              transition={{
                scale: { duration: 0.5, delay: 0.3 + i * 0.06 },
                opacity: { duration: 0.3 },
              }}
              onMouseEnter={() => setHoveredDomain(skill.domain)}
              onMouseLeave={() => setHoveredDomain(null)}
              style={{
                position: "absolute",
                left: skill.x,
                top: skill.y,
                fontSize: skill.size,
                fontWeight: skill.size >= 22 ? 600 : skill.size >= 18 ? 500 : 400,
                letterSpacing: skill.size >= 22 ? "-0.02em" : "0.02em",
                color: hoveredDomain === skill.domain
                  ? DOMAIN_TINTS[skill.domain]
                  : "var(--text-primary)",
                whiteSpace: "nowrap",
                cursor: "default",
                transition: "color 0.3s",
                willChange: "transform, opacity",
              }}
            >
              {skill.label}
            </motion.span>
          );
        })}

        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 24,
            pointerEvents: "none",
          }}
        >
          {(Object.entries(DOMAIN_TINTS) as [Domain, string][]).map(([domain, color]) => (
            <span
              key={domain}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: hoveredDomain === domain ? color : "var(--text-tertiary)",
                opacity: hoveredDomain && hoveredDomain !== domain ? 0.3 : 0.6,
                transition: "color 0.3s, opacity 0.3s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                  opacity: 0.6,
                }}
              />
              {domain}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Closing ───────── */

function SectionClosing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref}>
      <FadeIn visible={inView}>
        <div
          style={{
            padding: "28px 32px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--stroke)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(16px, 2vw, 20px)",
              fontWeight: 400,
              fontStyle: "italic",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              letterSpacing: "-0.01em",
            }}
          >
            &ldquo;I don&apos;t fit neatly into a box. That&apos;s the point.&rdquo;
          </p>
        </div>
      </FadeIn>

      <FadeIn visible={inView} delay={0.15}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Built this site in a weekend with AI. Because of course I did.
        </p>
      </FadeIn>
    </section>
  );
}

/* ───────── Shared pieces ───────── */

function FadeIn({ children, visible, delay = 0 }: { children: React.ReactNode; visible: boolean; delay?: number }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ${EASE} ${delay}s, transform 0.6s ${EASE} ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--stroke)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flex: "1 1 200px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 9,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ───────── Shared styles ───────── */

const edgeBodyStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "var(--text-secondary)",
};

const dualLabelStyle: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 9,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 16,
};

const dualHeadingStyle: CSSProperties = {
  fontSize: "clamp(18px, 2vw, 22px)",
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  color: "var(--text-primary)",
  marginBottom: 20,
};

const dualLineStyle: CSSProperties = {
  paddingLeft: 12,
  borderLeft: "2px solid rgba(255,255,255,0.08)",
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--text-secondary)",
};
