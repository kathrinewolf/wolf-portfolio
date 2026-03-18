"use client";

import { useRef, type CSSProperties } from "react";
import { motion, useInView } from "framer-motion";

/* ───────── Constants ───────── */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

interface Role {
  company: string;
  title: string;
  period: string;
  current?: boolean;
  summary: string;
  stats?: { label: string; value: string }[];
}

const ROLES: Role[] = [
  {
    company: "iceKore",
    title: "Co-Founder & Marketing Lead",
    period: "Nov 2024 \u2013 Present",
    current: true,
    summary:
      "Turned a backyard side-project into Denmark\u2019s leading high-end cold plunge company. Own all marketing, negotiated celebrity partnerships, and scaled paid acquisition profitably.",
    stats: [
      { label: "Role", value: "Co-Founder" },
      { label: "Scope", value: "Full-stack marketing" },
    ],
  },
  {
    company: "Heroic PBC",
    title: "Performance Marketing Manager",
    period: "Feb 2023 \u2013 Jan 2026",
    summary:
      "Led performance marketing with a 7-figure budget, managing a creative team and driving user acquisition through data-driven funnel optimization.",
    stats: [
      { label: "Paid spend scaled", value: "$0 \u2192 $400K/mo" },
      { label: "New leads driven", value: "200K+" },
      { label: "Book launch sales", value: "20K+ first week" },
      { label: "Affiliate revenue", value: "$500K+" },
    ],
  },
  {
    company: "WeCode A/S",
    title: "Communication & Marketing Lead",
    period: "Oct 2022 \u2013 Feb 2023",
    summary:
      "Led marketing for a 20-person software agency. Strategy and hands-on execution across paid ads, copywriting, and landing pages.",
  },
  {
    company: "CT Ejendomsservice",
    title: "Marketing Specialist",
    period: "Mar 2020 \u2013 Jun 2022",
    summary:
      "Built the entire digital presence for a spin-off company from scratch.",
  },
];

/* ───────── Component ───────── */

export function Work() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div ref={headerRef} style={{ marginBottom: 56 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={monoLabelStyle}
        >
          Work
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
          Where the work happened.
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
          }}
        >
          From startups to 7-figure launches. Always somewhere between
          strategy, data, and getting things out the door.
        </motion.p>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 32 }}>
        {/* Vertical timeline line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={headerInView ? { scaleY: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: 7,
            top: 8,
            bottom: 0,
            width: 1,
            background: "var(--stroke)",
            transformOrigin: "top",
          }}
        />

        {ROLES.map((role, i) => (
          <TimelineCard key={role.company} role={role} index={i} />
        ))}
      </div>
    </div>
  );
}

/* ───────── Timeline Card ───────── */

function TimelineCard({ role, index }: { role: Role; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        marginBottom: index < ROLES.length - 1 ? 48 : 0,
      }}
    >
      {/* Timeline dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          position: "absolute",
          left: -32 + 3,
          top: 24,
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: role.current ? "var(--text-primary)" : "var(--stroke)",
          border: role.current ? "none" : "1px solid var(--stroke-hover)",
          boxShadow: role.current
            ? "0 0 12px rgba(255,255,255,0.25)"
            : "none",
        }}
      />

      {/* Pulse ring for current */}
      {role.current && (
        <motion.div
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.4, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: -32 + 3,
            top: 24,
            width: 9,
            height: 9,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.3)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Card */}
      <FadeIn visible={inView} delay={0.15}>
        <div
          style={{
            padding: "28px 24px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--stroke)",
            transition: "border-color 0.3s, background 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--stroke-hover)";
            e.currentTarget.style.background = "rgba(255,255,255,0.045)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--stroke)";
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          }}
        >
          {/* Period + badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <span style={monoLabelStyle}>{role.period}</span>
            {role.current && (
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(160, 255, 200, 0.8)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid rgba(160, 255, 200, 0.15)",
                  background: "rgba(160, 255, 200, 0.05)",
                }}
              >
                Current
              </span>
            )}
          </div>

          {/* Company */}
          <h3
            style={{
              fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            {role.company}
          </h3>

          {/* Title */}
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 14,
            }}
          >
            {role.title}
          </p>

          {/* Summary */}
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--text-secondary)",
              maxWidth: 540,
              marginBottom: role.stats ? 18 : 0,
            }}
          >
            {role.summary}
          </p>

          {/* Stats */}
          {role.stats && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {role.stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--stroke)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    minWidth: 120,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: 8,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

/* ───────── Shared ───────── */

function FadeIn({
  children,
  visible,
  delay = 0,
}: {
  children: React.ReactNode;
  visible: boolean;
  delay?: number;
}) {
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

const monoLabelStyle: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
};
