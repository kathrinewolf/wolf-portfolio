"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const projects = [
  {
    name: "IceKore",
    description:
      "A data intelligence platform processing millions of records through automated pipelines. From raw data to actionable insights — built for scale.",
    tags: ["Data Engineering", "AI/ML", "Full-Stack"],
  },
  {
    name: "Life Vista",
    description:
      "A personal health dashboard that turns wearable data into clarity. Designed to be beautiful enough that you actually want to open it every morning.",
    tags: ["Design Systems", "Health Tech", "React"],
  },
  {
    name: "This Portfolio",
    description:
      "The site you're exploring right now. Scroll-driven frame animation, interactive Three.js neural network, custom shaders — built as proof of craft.",
    tags: ["WebGL", "GSAP", "Next.js"],
  },
];

export function WhatImBuilding() {
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
        What I&apos;m Building
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
        Three projects. One thread: make complex things feel simple.
      </motion.h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {projects.map((project, i) => (
          <motion.div
            key={project.name}
            {...fadeUp}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.6 }}
            style={{
              padding: "28px",
              borderRadius: "16px",
              border: "1px solid var(--stroke)",
              background: "var(--bg-card)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 500,
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              {project.name}
            </h3>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              {project.description}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    padding: "4px 10px",
                    border: "1px solid var(--stroke)",
                    borderRadius: "100px",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
