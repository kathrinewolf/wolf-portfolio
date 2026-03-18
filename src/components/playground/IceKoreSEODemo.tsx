"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserFrame } from "./BrowserFrame";
import { AnimatedCursor } from "./AnimatedCursor";

/*
  Simulates someone browsing icekore.dk/a/vinterbadning:
  1. Page loads with screenshot at top
  2. User scrolls down slowly (browsing content)
  3. Cursor appears and clicks a link
  4. New "page" loads (scrolls to different section)
  5. User scrolls that section, then back to top
  6. Loop
*/

type Phase =
  | "initial"
  | "scroll-down"
  | "pause-mid"
  | "cursor-appear"
  | "click"
  | "page-load"
  | "scroll-new"
  | "pause-end"
  | "fade-reset";

const VIEWPORT_HEIGHT = 380;

interface Props {
  isVisible: boolean;
}

export function IceKoreSEODemo({ isVisible }: Props) {
  const [phase, setPhase] = useState<Phase>("initial");
  const [scrollY, setScrollY] = useState(0);
  const [clicking, setClicking] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rafRef = useRef<number>(0);

  const reset = useCallback(() => {
    setPhase("initial");
    setScrollY(0);
    setClicking(false);
    setShowCursor(false);
  }, []);

  // Smooth scroll animation helper
  const animateScroll = useCallback(
    (from: number, to: number, duration: number, onDone: () => void) => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease in-out cubic
        const eased =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        setScrollY(from + (to - from) * eased);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          onDone();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    []
  );

  useEffect(() => {
    if (!isVisible) {
      reset();
      return;
    }
    // Cancel any pending timers on cleanup
    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, reset]);

  // Phase state machine
  useEffect(() => {
    if (!isVisible) return;

    switch (phase) {
      case "initial":
        // Hold at top briefly, then start scrolling
        timerRef.current = setTimeout(() => setPhase("scroll-down"), 1200);
        break;

      case "scroll-down":
        // Scroll down ~600px over 3s (browsing)
        animateScroll(0, 600, 3000, () => setPhase("pause-mid"));
        break;

      case "pause-mid":
        // Pause, then show cursor moving to a "link"
        timerRef.current = setTimeout(() => {
          setCursorPos({ x: 180, y: 160 });
          setShowCursor(true);
          setPhase("cursor-appear");
        }, 800);
        break;

      case "cursor-appear":
        // Move cursor to link position, then click
        timerRef.current = setTimeout(() => {
          setCursorPos({ x: 220, y: 180 });
          timerRef.current = setTimeout(() => setPhase("click"), 500);
        }, 600);
        break;

      case "click":
        setClicking(true);
        timerRef.current = setTimeout(() => {
          setClicking(false);
          setPhase("page-load");
        }, 400);
        break;

      case "page-load":
        // Jump to a different part of the page (simulating navigation)
        setShowCursor(false);
        setScrollY(1200);
        timerRef.current = setTimeout(() => setPhase("scroll-new"), 600);
        break;

      case "scroll-new":
        // Scroll down a bit on the "new page"
        animateScroll(1200, 1800, 3000, () => setPhase("pause-end"));
        break;

      case "pause-end":
        timerRef.current = setTimeout(() => setPhase("fade-reset"), 1500);
        break;

      case "fade-reset":
        timerRef.current = setTimeout(reset, 800);
        break;
    }

    return () => {
      clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, isVisible, animateScroll, reset]);

  return (
    <BrowserFrame url="icekore.dk/a/vinterbadning">
      <div
        style={{
          position: "relative",
          height: `${VIEWPORT_HEIGHT}px`,
          overflow: "hidden",
        }}
      >
        <AnimatePresence>
          {phase !== "fade-reset" ? (
            <motion.div
              key="content"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{
                transform: `translateY(${-scrollY}px)`,
                transition: phase === "page-load" ? "transform 0.4s ease-out" : undefined,
              }}
            >
              <img
                src="/playground/icekore-seo-scroll.png"
                alt="iceKore SEO directory page"
                style={{
                  width: "100%",
                  display: "block",
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="reset"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <img
                src="/playground/icekore-seo-scroll.png"
                alt="iceKore SEO directory page"
                style={{
                  width: "100%",
                  display: "block",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cursor */}
        {showCursor && (
          <AnimatedCursor
            x={cursorPos.x}
            y={cursorPos.y}
            clicking={clicking}
            visible
          />
        )}

        {/* Top fade */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "24px",
            background: "linear-gradient(to bottom, var(--bg-card), transparent)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "24px",
            background: "linear-gradient(to top, var(--bg-card), transparent)",
            pointerEvents: "none",
            zIndex: 3,
          }}
        />
      </div>
    </BrowserFrame>
  );
}
