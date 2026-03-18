"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

interface ProjectSectionProps {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  url?: string;
  urlLabel?: string;
  tags: string[];
  children: React.ReactNode;
  observerRef?: (el: HTMLDivElement | null) => void;
  isLast?: boolean;
}

export function ProjectSection({
  id,
  number,
  title,
  tagline,
  description,
  url,
  urlLabel,
  tags,
  children,
  observerRef,
  isLast,
}: ProjectSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={(el) => {
        (sectionRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        observerRef?.(el);
      }}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        paddingBottom: isLast ? "32px" : "64px",
        borderBottom: isLast ? "none" : "1px solid var(--stroke)",
      }}
    >
      {/* Project number */}
      <div
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: "20px",
        }}
      >
        {number}
      </div>

      {/* Demo area */}
      <div style={{ marginBottom: "32px" }}>
        {children}
      </div>

      {/* Title */}
      <h3
        className="gradient-text"
        style={{
          fontSize: "clamp(1.5rem, 3vw, 1.875rem)",
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>

      {/* Tagline */}
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "1rem",
          lineHeight: 1.5,
          marginBottom: "12px",
        }}
      >
        {tagline}
      </p>

      {/* Description */}
      <p
        style={{
          color: "var(--text-tertiary)",
          fontSize: "0.875rem",
          lineHeight: 1.6,
          maxWidth: "560px",
          marginBottom: "20px",
        }}
      >
        {description}
      </p>

      {/* Tags */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: url ? "20px" : "0",
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              border: "1px solid var(--stroke)",
              borderRadius: "4px",
              padding: "4px 8px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* View Project link */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          data-hover
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            const arrow = e.currentTarget.querySelector("span");
            if (arrow) arrow.style.transform = "translateX(4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-tertiary)";
            const arrow = e.currentTarget.querySelector("span");
            if (arrow) arrow.style.transform = "translateX(0)";
          }}
        >
          {urlLabel || "View Project"}
          <span style={{ transition: "transform 0.2s" }}>→</span>
        </a>
      )}
    </motion.div>
  );
}
