"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ProjectSection } from "../playground/ProjectSection";
import { HealthDashboardDemo } from "../playground/HealthDashboardDemo";
import { IceKoreAppDemo } from "../playground/IceKoreAppDemo";
import { RademirDemo } from "../playground/RademirDemo";
import { IceKoreSEODemo } from "../playground/IceKoreSEODemo";

const PROJECTS = [
  { id: "health-dashboard", label: "Health OS" },
  { id: "icekore-app", label: "iceKore App" },
  { id: "rademir", label: "Property Data" },
  { id: "icekore-seo", label: "iceKore SEO" },
];

export function Playground() {
  const [activeProject, setActiveProject] = useState(PROJECTS[0].id);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Intersection observer for active nav + demo visibility
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Find the scroll container (the parent with overflow: auto)
    const findScrollParent = (el: HTMLElement | null): HTMLElement | null => {
      while (el) {
        const style = getComputedStyle(el);
        if (style.overflow === "auto" || style.overflowY === "auto") return el;
        el = el.parentElement;
      }
      return null;
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const firstSection = sectionRefs.current.values().next().value;
      if (!firstSection) return;
      const scrollParent = findScrollParent(firstSection as HTMLDivElement);
      scrollContainerRef.current = scrollParent;

      sectionRefs.current.forEach((el, id) => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              setVisibleSections((prev) => {
                const next = new Set(prev);
                if (entry.isIntersecting) next.add(id);
                else next.delete(id);
                return next;
              });

              if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
                setActiveProject(id);
              }
            });
          },
          {
            root: scrollParent,
            threshold: [0.2, 0.5],
          }
        );
        observer.observe(el);
        observers.push(observer);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  const scrollToProject = useCallback((id: string) => {
    const el = sectionRefs.current.get(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const registerRef = useCallback((id: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) sectionRefs.current.set(id, el);
      else sectionRefs.current.delete(id);
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ marginBottom: "32px" }}
      >
        <div
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "10px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginBottom: "12px",
          }}
        >
          Playground
        </div>
        <h2
          className="gradient-text"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "12px",
          }}
        >
          Side projects & experiments
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.6,
            maxWidth: "480px",
          }}
        >
          Things I build for fun, curiosity, and the love of making.
        </p>
      </motion.div>

      {/* Sticky nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          paddingBottom: "24px",
          paddingTop: "8px",
          background: "rgba(5, 5, 7, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          marginBottom: "16px",
          marginLeft: "-8px",
          marginRight: "-8px",
          paddingLeft: "8px",
          paddingRight: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              data-hover
              onClick={() => scrollToProject(p.id)}
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "10px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "6px 12px",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: activeProject === p.id
                  ? "rgba(255,255,255,0.15)"
                  : "var(--stroke)",
                background: activeProject === p.id
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
                color: activeProject === p.id
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div style={{ display: "flex", flexDirection: "column", gap: "80px" }}>
        <ProjectSection
          id="health-dashboard"
          number="01"
          title="Health Dashboard"
          tagline="All your health data, gamified."
          description="Tired of scattered health apps, I connected them all and gamified the data. Sleep, activity, nutrition — one dashboard, one athlete rating that improves as you do."
          url="https://habit.alexanderwp.com"
          tags={["React", "Supabase", "Recharts", "Gamification"]}
          observerRef={registerRef("health-dashboard")}
        >
          <HealthDashboardDemo isVisible={visibleSections.has("health-dashboard")} />
        </ProjectSection>

        <ProjectSection
          id="icekore-app"
          number="02"
          title="iceKore App"
          tagline="Control your cold plunge from your phone."
          description="Control your iceKore cold plunge directly from your phone. Set temperature, track sessions, see your cold exposure history."
          tags={["iOS", "Bluetooth", "Health Tracking"]}
          observerRef={registerRef("icekore-app")}
        >
          <IceKoreAppDemo isVisible={visibleSections.has("icekore-app")} />
        </ProjectSection>

        <ProjectSection
          id="rademir"
          number="03"
          title="Property Intelligence"
          tagline="Enhanced property listings with AI."
          description="Paste any Danish property listing. Get it back enhanced with school proximity, crime stats, flood risk, noise levels, and AI analysis — all injected directly into the listing."
          url="https://rademir.alexanderwp.com"
          tags={["Next.js", "Claude AI", "Danish APIs", "Data Enrichment"]}
          observerRef={registerRef("rademir")}
        >
          <RademirDemo isVisible={visibleSections.has("rademir")} />
        </ProjectSection>

        <ProjectSection
          id="icekore-seo"
          number="04"
          title="iceKore SEO Directory"
          tagline="Programmatic SEO at scale."
          description="Built a programmatic SEO directory of sauna and winter bathing clubs across Denmark to drive targeted organic traffic to iceKore."
          url="https://icekore.dk/a/vinterbadning"
          tags={["Programmatic SEO", "Next.js", "Directory"]}
          observerRef={registerRef("icekore-seo")}
          isLast
        >
          <IceKoreSEODemo isVisible={visibleSections.has("icekore-seo")} />
        </ProjectSection>
      </div>
    </div>
  );
}
