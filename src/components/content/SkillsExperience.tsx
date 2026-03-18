"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

interface SkillCluster {
  name: string;
  skills: { label: string; level: number }[]; // level 1-5 maps to font size
}

const clusters: SkillCluster[] = [
  {
    name: "Engineering",
    skills: [
      { label: "TypeScript", level: 5 },
      { label: "React / Next.js", level: 5 },
      { label: "Python", level: 4 },
      { label: "Node.js", level: 4 },
      { label: "Three.js / WebGL", level: 3 },
      { label: "Data Pipelines", level: 4 },
      { label: "PostgreSQL", level: 3 },
    ],
  },
  {
    name: "AI & Intelligence",
    skills: [
      { label: "Prompt Engineering", level: 5 },
      { label: "AI Agents", level: 4 },
      { label: "LLM Integration", level: 5 },
      { label: "RAG Systems", level: 3 },
      { label: "Automation", level: 4 },
    ],
  },
  {
    name: "Design & Growth",
    skills: [
      { label: "UI/UX Design", level: 4 },
      { label: "Design Systems", level: 4 },
      { label: "Growth Strategy", level: 4 },
      { label: "Product Thinking", level: 5 },
      { label: "Funnel Optimization", level: 3 },
    ],
  },
];

function sizeFromLevel(level: number): number {
  const sizes = [12, 14, 16, 20, 26];
  return sizes[level - 1] || 14;
}

function opacityFromLevel(level: number): number {
  return 0.3 + level * 0.14;
}

export function SkillsExperience() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <motion.p
        {...fadeUp}
        transition={{ delay: 0.1, duration: 0.6 }}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
        }}
      >
        Skills & Craft
      </motion.p>

      <motion.h2
        {...fadeUp}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="gradient-text"
        style={{
          fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
          fontWeight: 500,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
        }}
      >
        Full-stack with depth, not just breadth.
      </motion.h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
        {clusters.map((cluster, ci) => (
          <motion.div
            key={cluster.name}
            {...fadeUp}
            transition={{ delay: 0.3 + ci * 0.12, duration: 0.6 }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                marginBottom: "16px",
              }}
            >
              {cluster.name}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 18px",
                alignItems: "baseline",
              }}
            >
              {cluster.skills.map((skill) => (
                <span
                  key={skill.label}
                  style={{
                    fontSize: `${sizeFromLevel(skill.level)}px`,
                    fontWeight: skill.level >= 4 ? 500 : 400,
                    color: `rgba(255,255,255,${opacityFromLevel(skill.level)})`,
                    lineHeight: 1.4,
                  }}
                >
                  {skill.label}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
