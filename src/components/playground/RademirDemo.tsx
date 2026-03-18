"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";
import { AnimatedCursor } from "./AnimatedCursor";

const TYPED_URL = "boligsiden.dk/adresse/soelleroedvej-93-2840-holte";
const TYPE_SPEED = 40;

type Phase = "typing" | "clicking" | "loading" | "result" | "hold";

const ENRICHMENT_SECTIONS = [
  {
    title: "Ideal for",
    items: ["Family home", "Quiet upscale living", "Long-term buy"],
  },
  {
    title: "Standouts",
    items: [
      "6-room villa on a 1,002 m\u00B2 plot",
      "Estimated 12% below area average",
      "Quiet: 46 dB day, 38 dB night",
      "Strong schools within 1.2 km",
    ],
  },
  {
    title: "Area at a glance",
    chips: [
      { label: "Noise", value: "Low", color: "#4ade80" },
      { label: "Schools", value: "8.6/10", color: "#4ade80" },
      { label: "Safety", value: "Above avg", color: "#4ade80" },
      { label: "Flood", value: "Low risk", color: "#4ade80" },
      { label: "Commute", value: "28 min", color: "#facc15" },
    ],
  },
];

interface Props {
  isVisible: boolean;
}

export function RademirDemo({ isVisible }: Props) {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typedChars, setTypedChars] = useState(0);
  const [clicking, setClicking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const reset = useCallback(() => {
    setPhase("typing");
    setTypedChars(0);
    setClicking(false);
  }, []);

  useEffect(() => {
    if (!isVisible || phase !== "typing") return;
    intervalRef.current = setInterval(() => {
      setTypedChars((c) => {
        if (c >= TYPED_URL.length) {
          clearInterval(intervalRef.current);
          timerRef.current = setTimeout(() => setPhase("clicking"), 300);
          return c;
        }
        return c + 1;
      });
    }, TYPE_SPEED);
    return () => { clearInterval(intervalRef.current); clearTimeout(timerRef.current); };
  }, [phase, isVisible]);

  useEffect(() => {
    if (phase !== "clicking") return;
    const t1 = setTimeout(() => setClicking(true), 400);
    const t2 = setTimeout(() => setPhase("loading"), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    timerRef.current = setTimeout(() => setPhase("result"), 1800);
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "result") return;
    timerRef.current = setTimeout(() => setPhase("hold"), 5000);
    return () => clearTimeout(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "hold") return;
    timerRef.current = setTimeout(reset, 1200);
    return () => clearTimeout(timerRef.current);
  }, [phase, reset]);

  useEffect(() => {
    if (!isVisible) reset();
  }, [isVisible, reset]);

  const displayText = TYPED_URL.slice(0, typedChars);
  const showInput = phase === "typing" || phase === "clicking";
  const showLoading = phase === "loading";
  const showResult = phase === "result" || phase === "hold";

  return (
    <BrowserFrame url="rademir.alexanderwp.com">
      <div
        style={{
          position: "relative",
          minHeight: "420px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <AnimatePresence mode="wait">
          {showInput && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px",
              }}
            >
              <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{
                  fontFamily: "var(--font-geist-mono), monospace", fontSize: "10px",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "var(--text-tertiary)", marginBottom: "4px",
                }}>
                  Paste a listing URL
                </div>
                <div style={{
                  background: "var(--bg-surface)", border: "1px solid var(--stroke-hover)",
                  borderRadius: "8px", padding: "12px 16px",
                  fontFamily: "var(--font-geist-mono), monospace", fontSize: "12px",
                  color: "var(--text-primary)", minHeight: "44px",
                  display: "flex", alignItems: "center",
                }}>
                  {displayText}
                  {phase === "typing" && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                      style={{ display: "inline-block", width: "1px", height: "16px", background: "var(--text-primary)", marginLeft: "1px" }}
                    />
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <button style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    border: "1px solid var(--stroke)",
                    background: typedChars >= TYPED_URL.length ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    color: typedChars >= TYPED_URL.length ? "var(--text-secondary)" : "var(--text-tertiary)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
                    cursor: "default", transition: "all 0.3s",
                  }}>
                    Enhance Listing
                  </button>
                  {phase === "clicking" && <AnimatedCursor x={190} y={18} clicking={clicking} visible />}
                </div>
              </div>
            </motion.div>
          )}

          {showLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px" }}
            >
              <div style={{ width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[0.6, 1, 0.8, 0.5].map((w, i) => (
                  <div key={i} className="shimmer-bar" style={{ height: "14px", width: `${w * 100}%`, borderRadius: "4px", animationDelay: `${i * 0.12}s` }} />
                ))}
                <div style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "10px", color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "8px" }}>
                  Enriching listing data...
                </div>
              </div>
            </motion.div>
          )}

          {showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ padding: "20px", overflow: "hidden" }}
            >
              {/* Listing header */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  display: "flex", gap: "16px", alignItems: "flex-start",
                  paddingBottom: "16px", borderBottom: "1px solid var(--stroke)", marginBottom: "16px",
                }}
              >
                {/* House image placeholder */}
                <div style={{
                  width: "120px", minHeight: "80px", borderRadius: "8px", flexShrink: 0,
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08))",
                  border: "1px solid var(--stroke)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <path d="M9 22V12h6v10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    S&oslash;ller&oslash;dvej 93, 2840 Holte
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    6-room villa &middot; 1,002 m&sup2; plot &middot; 188 m&sup2;
                  </div>
                  <div style={{
                    display: "inline-block", marginTop: "8px", padding: "3px 8px", borderRadius: "4px",
                    background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.2)",
                    fontFamily: "var(--font-geist-mono), monospace", fontSize: "10px", color: "rgba(74, 222, 128, 0.8)",
                  }}>
                    Est. 12% below area avg
                  </div>
                </div>
              </motion.div>

              {/* Enrichment sections */}
              {ENRICHMENT_SECTIONS.map((section, si) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + si * 0.15 }}
                  style={{ marginBottom: "16px" }}
                >
                  <div style={{
                    fontFamily: "var(--font-geist-mono), monospace", fontSize: "9px",
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "var(--text-tertiary)", marginBottom: "8px",
                  }}>
                    {section.title}
                  </div>

                  {section.items && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {section.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + si * 0.15 + i * 0.06 }}
                          style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5,
                          }}
                        >
                          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                          {item}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {section.chips && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {section.chips.map((chip, i) => (
                        <motion.div
                          key={chip.label}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + si * 0.15 + i * 0.06 }}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            padding: "4px 8px", border: "1px solid var(--stroke)",
                            borderRadius: "4px", background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: chip.color, opacity: 0.6 }} />
                          <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: "9px", color: "var(--text-secondary)" }}>
                            {chip.label}: {chip.value}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* AI Analysis snippet */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                  padding: "12px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid var(--stroke)",
                }}
              >
                <div style={{
                  fontFamily: "var(--font-geist-mono), monospace", fontSize: "9px",
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: "var(--text-tertiary)", marginBottom: "8px",
                }}>
                  AI Analysis
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Move-in-ready family villa. Biggest strengths are quiet setting, generous plot, and strong school access. Main question is price vs micro-location.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BrowserFrame>
  );
}
