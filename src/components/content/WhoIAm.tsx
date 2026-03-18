"use client";

import { useRef, useEffect, useState, type CSSProperties } from "react";
import { motion, useInView, useAnimation, AnimatePresence } from "framer-motion";

/* ───────── Constants ───────── */

const VIRTUES = [
  "Courage", "Love", "Laughter", "Hope", "Enthusiasm",
  "Smile", "Say Yes",
];

const SPORT_IMAGES = [
  { src: "/whoiam/sport-hyrox.jpg", alt: "HYROX sled pull", label: "HYROX Copenhagen" },
  { src: "/whoiam/sport-marathon.jpg", alt: "Copenhagen Marathon", label: "Copenhagen Marathon" },
  { src: "/whoiam/sport-boxing.jpg", alt: "Boxing gym", label: "Boxing nights" },
];

const ADVENTURE_IMAGES = [
  { src: "/whoiam/adv-skydiving.jpg", alt: "Skydiving in Hawaii", loc: "Hawaii" },
  { src: "/whoiam/adv-cliff.jpg", alt: "Via Ferrata cliff face", loc: "Italy" },
  { src: "/whoiam/adv-paragliding.jpg", alt: "Paragliding over Japan", loc: "Japan" },
  { src: "/whoiam/adv-hawaii-summit.jpg", alt: "Mountain summit, Hawaii", loc: "Hawaii" },
  { src: "/whoiam/adv-fuji.jpg", alt: "Mount Fuji summit", loc: "Mt. Fuji" },
  { src: "/whoiam/adv-glacier-selfie.jpg", alt: "Glacier mountaineering", loc: "Alps" },
  { src: "/whoiam/adv-canyoneering.jpg", alt: "Waterfall canyoneering", loc: "Madeira" },
  { src: "/whoiam/adv-dolomites-group.jpg", alt: "Tre Cime, Dolomites", loc: "Dolomites" },
  { src: "/whoiam/adv-stairway.jpg", alt: "Stairway to Heaven, Oahu", loc: "Oahu" },
  { src: "/whoiam/adv-sharks.jpg", alt: "Swimming with sharks", loc: "Pacific" },
  { src: "/whoiam/adv-viaferrata.jpg", alt: "Via Ferrata climbing", loc: "Dolomites" },
  { src: "/whoiam/adv-glacier-climb.jpg", alt: "Glacier ascent", loc: "Alps" },
];

const HYGGE_FACTS = [
  { emoji: "🍦", text: "I eat an unreasonable amount of ice cream. Like, genuinely unreasonable." },
  { emoji: "📺", text: "I've seen every season of Paradise Hotel and Selling Sunset. No regrets." },
  { emoji: "🎤", text: "Terrible singer. Awesome karaoke star. Two very different things." },
  { emoji: "🇩🇰", text: "Copenhagen born. Still here. Still in love with it." },
];

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ───────── Component ───────── */

export function WhoIAm() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Header />
      <VirtueScatter />
      <SectionAthletics />
      <SectionAdventure />
      <SectionHygge />
    </div>
  );
}

/* ───────── Header ───────── */

function Header() {
  return (
    <div style={{ marginBottom: 48 }}>
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
        Who I Am
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
        Who is this guy?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          fontSize: 16,
          lineHeight: 1.7,
          color: "var(--text-secondary)",
          maxWidth: 480,
        }}
      >
        Somewhere between building things, breaking personal records, and eating
        ice cream. There&apos;s a life in there somewhere.
      </motion.p>
    </div>
  );
}

/* ───────── Virtue Scatter (animated floating words) ───────── */

const VIRTUE_POSITIONS = [
  { x: "5%",  y: "15%", size: 28, weight: 700, delay: 0 },
  { x: "52%", y: "5%",  size: 18, weight: 400, delay: 0.3 },
  { x: "78%", y: "22%", size: 24, weight: 600, delay: 0.6 },
  { x: "25%", y: "55%", size: 14, weight: 400, delay: 0.9 },
  { x: "62%", y: "48%", size: 32, weight: 700, delay: 0.2 },
  { x: "8%",  y: "75%", size: 20, weight: 500, delay: 0.5 },
  { x: "45%", y: "80%", size: 16, weight: 400, delay: 0.8 },
];

function VirtueScatter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        height: 180,
        marginBottom: 64,
        overflow: "hidden",
      }}
    >
      {VIRTUES.map((word, i) => {
        const pos = VIRTUE_POSITIONS[i];
        return (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={
              inView
                ? {
                    opacity: [0, 0.9, 0.6],
                    y: [30, 0, -8, 0],
                    scale: [0.8, 1.05, 1],
                  }
                : {}
            }
            transition={{
              duration: 1.8,
              delay: pos.delay,
              ease: "easeOut",
              y: {
                duration: 6,
                delay: pos.delay + 1.8,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              },
              opacity: {
                duration: 1.2,
                delay: pos.delay,
              },
            }}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              fontSize: typeof window !== "undefined" && window.innerWidth < 768 ? pos.size * 0.7 : pos.size,
              fontWeight: pos.weight,
              letterSpacing: pos.size > 24 ? "-0.03em" : "0.04em",
              textTransform: pos.size < 20 ? "uppercase" : "none",
              color:
                pos.size > 24
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              willChange: "transform, opacity",
            }}
          >
            {word}
          </motion.span>
        );
      })}
      {/* Subtle connecting lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderTop: "1px solid var(--stroke)",
          borderBottom: "1px solid var(--stroke)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ───────── Athletics ───────── */

function SectionAthletics() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} style={{ marginBottom: 96 }}>
      <FadeIn visible={inView}>
        <SectionLabel>01 / Athletics</SectionLabel>
      </FadeIn>

      <FadeIn visible={inView} delay={0.1}>
        <h3 style={sectionTitleStyle}>
          If it moves, I&apos;m in.
        </h3>
      </FadeIn>

      <FadeIn visible={inView} delay={0.2}>
        <p style={sectionBodyStyle}>
          While Claude is doing my work, find me out running, training, playing.
          If it has anything to do with moving or balls, I&apos;m there.
        </p>
      </FadeIn>

      {/* Bento grid */}
      <FadeIn visible={inView} delay={0.3}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gridTemplateRows: "auto auto",
          gap: 10,
          marginTop: 32,
        }}>
          {/* Hero: HYROX — tall left */}
          <div style={{
            gridRow: "1 / 3",
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            minHeight: 420,
          }}>
            <img
              src={SPORT_IMAGES[0].src}
              alt={SPORT_IMAGES[0].alt}
              loading="lazy"
              style={{ ...imgFill, objectPosition: "center 20%" }}
            />
            <ImageOverlay />
            <ImageLabel>{SPORT_IMAGES[0].label}</ImageLabel>
          </div>

          {/* Marathon — top right */}
          <div style={{
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            minHeight: 200,
          }}>
            <img
              src={SPORT_IMAGES[1].src}
              alt={SPORT_IMAGES[1].alt}
              loading="lazy"
              style={imgFill}
            />
            <ImageOverlay />
            <ImageLabel>{SPORT_IMAGES[1].label}</ImageLabel>
          </div>

          {/* Boxing — bottom right */}
          <div style={{
            position: "relative",
            borderRadius: 16,
            overflow: "hidden",
            minHeight: 200,
          }}>
            <img
              src={SPORT_IMAGES[2].src}
              alt={SPORT_IMAGES[2].alt}
              loading="lazy"
              style={imgFill}
            />
            <ImageOverlay />
            <ImageLabel>{SPORT_IMAGES[2].label}</ImageLabel>
          </div>
        </div>
      </FadeIn>

      {/* Stat chips — no guilty pleasure */}
      <FadeIn visible={inView} delay={0.45}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
          <StatChip label="Next goal" value="Sub 3 marathon" />
          <StatChip label="Current obsession" value="Lift heavy, run fast" />
        </div>
      </FadeIn>
    </section>
  );
}

/* ───────── Adventure ───────── */

function SectionAdventure() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} style={{ marginBottom: 96 }}>
      <FadeIn visible={inView}>
        <SectionLabel>02 / Adventure</SectionLabel>
      </FadeIn>

      <FadeIn visible={inView} delay={0.1}>
        <h3 style={sectionTitleStyle}>
          Say yes first. Figure it out later.
        </h3>
      </FadeIn>

      <FadeIn visible={inView} delay={0.2}>
        <p style={sectionBodyStyle}>
          Jumped out of planes, climbed glaciers, swam with sharks, stood on
          volcanos. Not because I&apos;m fearless. Because the best stories
          start with &ldquo;I have no idea what I&apos;m doing.&rdquo;
        </p>
      </FadeIn>

      {/* Masonry photo grid */}
      <FadeIn visible={inView} delay={0.3}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          marginTop: 32,
        }}>
          {/* Row 1: hero span-2 + portrait */}
          <div style={{ gridColumn: "1 / 3", position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 280 }}>
            <img src={ADVENTURE_IMAGES[0].src} alt={ADVENTURE_IMAGES[0].alt} loading="lazy" style={imgFill} />
            <ImageOverlay />
            <ImageLabel>{ADVENTURE_IMAGES[0].loc}</ImageLabel>
          </div>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 280 }}>
            <img src={ADVENTURE_IMAGES[1].src} alt={ADVENTURE_IMAGES[1].alt} loading="lazy" style={{ ...imgFill, objectPosition: "center 30%" }} />
            <ImageOverlay />
            <ImageLabel>{ADVENTURE_IMAGES[1].loc}</ImageLabel>
          </div>

          {/* Row 2: 3 equal */}
          {ADVENTURE_IMAGES.slice(2, 5).map((img) => (
            <div key={img.src} style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 220 }}>
              <img src={img.src} alt={img.alt} loading="lazy" style={imgFill} />
              <ImageOverlay />
              <ImageLabel>{img.loc}</ImageLabel>
            </div>
          ))}

          {/* Row 3: portrait + span-2 landscape */}
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 280 }}>
            <img src={ADVENTURE_IMAGES[5].src} alt={ADVENTURE_IMAGES[5].alt} loading="lazy" style={imgFill} />
            <ImageOverlay />
            <ImageLabel>{ADVENTURE_IMAGES[5].loc}</ImageLabel>
          </div>
          <div style={{ gridColumn: "2 / 4", position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 280 }}>
            <img src={ADVENTURE_IMAGES[6].src} alt={ADVENTURE_IMAGES[6].alt} loading="lazy" style={imgFill} />
            <ImageOverlay />
            <ImageLabel>{ADVENTURE_IMAGES[6].loc}</ImageLabel>
          </div>

          {/* Row 4: 3 equal */}
          {ADVENTURE_IMAGES.slice(7, 10).map((img) => (
            <div key={img.src} style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 220 }}>
              <img src={img.src} alt={img.alt} loading="lazy" style={imgFill} />
              <ImageOverlay />
              <ImageLabel>{img.loc}</ImageLabel>
            </div>
          ))}

          {/* Row 5: span-2 + portrait */}
          <div style={{ gridColumn: "1 / 3", position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 260 }}>
            <img src={ADVENTURE_IMAGES[10].src} alt={ADVENTURE_IMAGES[10].alt} loading="lazy" style={imgFill} />
            <ImageOverlay />
            <ImageLabel>{ADVENTURE_IMAGES[10].loc}</ImageLabel>
          </div>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 260 }}>
            <img src={ADVENTURE_IMAGES[11].src} alt={ADVENTURE_IMAGES[11].alt} loading="lazy" style={imgFill} />
            <ImageOverlay />
            <ImageLabel>{ADVENTURE_IMAGES[11].loc}</ImageLabel>
          </div>
        </div>
      </FadeIn>

      {/* Quote instead of country stats */}
      <FadeIn visible={inView} delay={0.45}>
        <div style={{
          marginTop: 24,
          padding: "28px 32px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--stroke)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(16px, 2vw, 20px)",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            letterSpacing: "-0.01em",
          }}>
            &ldquo;Collecting stories, not stamps in a passport.&rdquo;
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

/* ───────── Hygge ───────── */

function SectionHygge() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref}>
      <FadeIn visible={inView}>
        <SectionLabel>03 / Hygge</SectionLabel>
      </FadeIn>

      <FadeIn visible={inView} delay={0.1}>
        <h3 style={sectionTitleStyle}>
          Making time for the small things.
        </h3>
      </FadeIn>

      <FadeIn visible={inView} delay={0.2}>
        <p style={sectionBodyStyle}>
          It can&apos;t all be performance and speed. Some of the best moments
          are the quietest. A couch, a bowl of ice cream, and something
          beautifully terrible on TV.
        </p>
      </FadeIn>

      {/* Fun fact cards — no images, no coffee */}
      <FadeIn visible={inView} delay={0.3}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          marginTop: 32,
        }}>
          {HYGGE_FACTS.map((fact, i) => (
            <div
              key={i}
              style={{
                padding: "24px 20px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--stroke)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "border-color 0.3s, background 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--stroke-hover)";
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--stroke)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
            >
              <span style={{ fontSize: 28 }}>{fact.emoji}</span>
              <p style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}>
                {fact.text}
              </p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Closing note */}
      <FadeIn visible={inView} delay={0.4}>
        <div style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: "1px solid var(--stroke)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(18px, 2.5vw, 24px)",
            fontWeight: 500,
            lineHeight: 1.4,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            maxWidth: 520,
            margin: "0 auto",
          }}>
            Life is too short to take yourself too seriously.
          </p>
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            marginTop: 16,
          }}>
            Fun fact: I have never said no to ice cream. Ever.
          </p>
        </div>
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
    <div style={{
      fontFamily: "var(--font-mono), monospace",
      fontSize: 10,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "12px 16px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid var(--stroke)",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      flex: "1 1 200px",
    }}>
      <span style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 9,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: "var(--text-primary)",
      }}>
        {value}
      </span>
    </div>
  );
}

function ImageOverlay() {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)",
      pointerEvents: "none",
    }} />
  );
}

function ImageLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      position: "absolute",
      bottom: 12,
      left: 14,
      fontFamily: "var(--font-mono), monospace",
      fontSize: 10,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.75)",
      zIndex: 2,
    }}>
      {children}
    </span>
  );
}

/* ───────── Shared styles ───────── */

const imgFill: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "clamp(1.4rem, 3vw, 2rem)",
  fontWeight: 600,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  color: "var(--text-primary)",
  marginBottom: 12,
};

const sectionBodyStyle: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "var(--text-secondary)",
  maxWidth: 520,
};
