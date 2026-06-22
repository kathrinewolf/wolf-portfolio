"use client";

import { useState, type CSSProperties, type MouseEvent } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { Playground } from "@/components/content/Playground";
import { Craft } from "@/components/content/Craft";
import { Work } from "@/components/content/Work";
import { WhoIAm } from "@/components/content/WhoIAm";
import { Connect } from "@/components/content/Connect";

/*
  The "good old days" one-pager. A deliberately ordinary, vertically scrolling
  website for visitors who'd rather skip the 3D brain. It reuses the exact same
  five section components (with their animations) — just stacked in a normal
  page with a header, hero, and footer.
*/

type Section = {
  id: string;
  label: string;
  Comp: React.ComponentType;
  wide: boolean;
};

const SECTIONS: Section[] = [
  { id: "projects", label: "Projects", Comp: Playground, wide: true },
  { id: "craft", label: "What I Do", Comp: Craft, wide: true },
  { id: "work", label: "Experience", Comp: Work, wide: false },
  { id: "about", label: "Who I Am", Comp: WhoIAm, wide: true },
  { id: "contact", label: "Contact", Comp: Connect, wide: false },
];

export default function ClassicPage() {
  const lenis = useLenis();

  const scrollTo = (id: string) => (e: MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -24 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main style={{ background: "var(--bg-deep)", minHeight: "100vh", width: "100%" }}>
      {/* ---------- Header ---------- */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px clamp(16px, 5vw, 48px)",
          maxWidth: 1240,
          margin: "0 auto",
        }}
      >
        <a
          href="#top"
          onClick={scrollTo("top")}
          data-hover
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Alexander Wolf Pedersen
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="classic-nav-links" style={{ display: "flex", gap: 2 }}>
            {SECTIONS.map((s) => (
              <NavLink key={s.id} onClick={scrollTo(s.id)}>
                {s.label}
              </NavLink>
            ))}
          </div>
          <Link href="/" data-hover className="classic-brain-link" style={brainLinkStyle}>
            Dive into my brain <span aria-hidden>↗</span>
          </Link>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section
        id="top"
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "clamp(48px, 9vw, 120px) clamp(16px, 5vw, 48px) clamp(40px, 6vw, 72px)",
        }}
      >
        <div style={eyebrowStyle}>The simple version</div>
        <h1
          style={{
            fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            marginBottom: 20,
            color: "var(--text-primary)",
          }}
        >
          Alexander Wolf Pedersen
        </h1>
        <p
          className="gradient-text"
          style={{
            fontSize: "clamp(1.1rem, 2.8vw, 1.7rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            marginBottom: 22,
          }}
        >
          Entrepreneur, AI builder, value creator.
        </p>
        <p
          style={{
            fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            maxWidth: 620,
            marginBottom: 28,
          }}
        >
          I build things I&apos;m passionate about, in health and in tech. No 3D
          brain, no scroll tricks. Just what I do, what I&apos;ve built, who I am,
          and how to reach me.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <button onClick={scrollTo("projects")} data-hover style={primaryBtnStyle}>
            See what I&apos;ve built
          </button>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            Welcome back to the good old days.
          </span>
        </div>
      </section>

      {/* ---------- Sections ---------- */}
      {SECTIONS.map((s) => (
        <section
          key={s.id}
          id={s.id}
          style={{
            borderTop: "1px solid var(--stroke)",
            padding: "clamp(56px, 8vw, 100px) 0",
            scrollMarginTop: 24,
          }}
        >
          <div
            style={{
              maxWidth: s.wide ? 1080 : 820,
              margin: "0 auto",
              padding: "0 clamp(16px, 5vw, 48px)",
            }}
          >
            <s.Comp />
          </div>
        </section>
      ))}

      {/* ---------- Footer ---------- */}
      <footer
        style={{
          borderTop: "1px solid var(--stroke)",
          padding: "clamp(48px, 7vw, 80px) clamp(16px, 5vw, 48px)",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "clamp(1.2rem, 2.4vw, 1.6rem)",
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Curious what the fuss was about?
          </p>
          <Link href="/" data-hover style={{ ...primaryBtnStyle, textDecoration: "none" }}>
            Dive into my brain <span aria-hidden>↗</span>
          </Link>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginTop: 8,
            }}
          >
            Alexander Wolf Pedersen · Copenhagen · Available worldwide
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ───────── Bits ───────── */

function NavLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: (e: MouseEvent) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="#"
      onClick={onClick}
      data-hover
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: hover ? "var(--text-primary)" : "var(--text-tertiary)",
        textDecoration: "none",
        padding: "8px 12px",
        borderRadius: 8,
        background: hover ? "rgba(255,255,255,0.05)" : "transparent",
        transition: "color 0.2s, background 0.2s",
      }}
    >
      {children}
    </a>
  );
}

const eyebrowStyle: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "var(--text-tertiary)",
  marginBottom: 20,
};

const brainLinkStyle: CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  textDecoration: "none",
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--stroke)",
  whiteSpace: "nowrap",
  transition: "border-color 0.2s, color 0.2s",
};

const primaryBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontFamily: "var(--font-mono), monospace",
  fontSize: 12,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-primary)",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--stroke-hover)",
  borderRadius: 12,
  padding: "13px 24px",
  cursor: "pointer",
};
