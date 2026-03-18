"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { useIsTouchDevice } from "@/hooks/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 181;

interface Props {
  onSequenceComplete?: () => void;
  scrollBackRef?: React.MutableRefObject<(() => void) | null>;
}

export function PortraitScrollSection({ onSequenceComplete, scrollBackRef }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(FRAME_COUNT).fill(null));
  const lastDrawnIndex = useRef(-1);
  const completeFired = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const isTouch = useIsTouchDevice();

  // Idle breathing state
  const idleFrame = useRef(0);
  const hasScrolled = useRef(false);
  const reverseAnimating = useRef(false);

  // Preload frames
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;

    const loadFrame = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (framesRef.current[index]) { resolve(); return; }
        const img = new Image();
        img.onload = () => {
          if (!cancelled) {
            framesRef.current[index] = img;
            loaded++;
            setLoadProgress(loaded / FRAME_COUNT);
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = `/frames/frame-${String(index + 1).padStart(3, "0")}.jpg`;
      });
    };

    const loadAll = async () => {
      // Tier 1: first 15 frames
      const tier1 = Array.from({ length: Math.min(15, FRAME_COUNT) }, (_, i) => i);
      await Promise.all(tier1.map(loadFrame));
      if (cancelled) return;

      // Tier 2: every 5th frame
      const tier2: number[] = [];
      for (let i = 15; i < FRAME_COUNT; i += 5) {
        if (!framesRef.current[i]) tier2.push(i);
      }
      await Promise.all(tier2.map(loadFrame));
      if (cancelled) return;

      // Wait for tier 1+2 before showing (~36 frames)
      setIsReady(true);

      // Tier 3: fill remaining in batches
      const tier3: number[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (!framesRef.current[i]) tier3.push(i);
      }
      for (let b = 0; b < tier3.length; b += 10) {
        if (cancelled) return;
        await Promise.all(tier3.slice(b, b + 10).map(loadFrame));
      }
    };

    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Canvas drawing loop
  useEffect(() => {
    if (!isReady) return;
    let rafId: number;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafId = requestAnimationFrame(draw); return; }

      const progress = progressRef.current;

      // Track if user has scrolled
      if (progress > 0.005) {
        hasScrolled.current = true;
      }

      // Determine frame index: idle breathing or scroll-driven
      let frameIndex: number;
      if (!hasScrolled.current && progress < 0.01) {
        // Idle breathing: slowly loop frames 0-8
        idleFrame.current += 0.04;
        if (idleFrame.current > 8) idleFrame.current = 0;
        frameIndex = Math.floor(idleFrame.current);
      } else {
        frameIndex = Math.min(
          Math.floor(progress * (FRAME_COUNT - 1)),
          FRAME_COUNT - 1
        );
      }

      // Find best available frame
      let frame = framesRef.current[frameIndex];
      if (!frame) {
        for (let d = 1; d < FRAME_COUNT; d++) {
          if (frameIndex - d >= 0 && framesRef.current[frameIndex - d]) {
            frame = framesRef.current[frameIndex - d];
            break;
          }
          if (frameIndex + d < FRAME_COUNT && framesRef.current[frameIndex + d]) {
            frame = framesRef.current[frameIndex + d];
            break;
          }
        }
      }

      if (frame && frameIndex !== lastDrawnIndex.current) {
        lastDrawnIndex.current = frameIndex;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        ctx.clearRect(0, 0, w, h);

        // Cover-fit
        const imgRatio = frame.naturalWidth / frame.naturalHeight;
        const canvasRatio = w / h;
        let dw: number, dh: number, dx: number, dy: number;
        if (imgRatio > canvasRatio) {
          dh = h; dw = h * imgRatio; dx = (w - dw) / 2; dy = 0;
        } else {
          dw = w; dh = w / imgRatio; dx = 0; dy = (h - dh) / 2;
        }
        ctx.drawImage(frame, dx, dy, dw, dh);
      }

      // Fade to black in last 15%
      const fadeStart = 0.85;
      if (progress > fadeStart) {
        const fadeAlpha = (progress - fadeStart) / (1 - fadeStart);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        ctx.fillStyle = `rgba(5, 5, 7, ${fadeAlpha})`;
        ctx.fillRect(0, 0, w, h);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [isReady]);

  // ScrollTrigger
  useGSAP(
    () => {
      if (!sectionRef.current || !isReady) return;

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          progressRef.current = self.progress;
          // Only fire completion when past 95% and not during reverse animation
          if (self.progress > 0.95 && !completeFired.current && !reverseAnimating.current) {
            completeFired.current = true;
            onSequenceComplete?.();
          }
        },
      });
    },
    { scope: sectionRef, dependencies: [isReady] }
  );

  // Register scroll-back function — smoothly reverses the animation
  useEffect(() => {
    if (!scrollBackRef) return;
    scrollBackRef.current = () => {
      const section = sectionRef.current;
      if (!section || reverseAnimating.current) return;
      reverseAnimating.current = true;
      // Keep completeFired true during reverse to prevent re-triggering brain
      completeFired.current = true;

      // Smooth reverse over 3.5s — lets user see the animation play backwards
      const start = window.scrollY;
      const end = section.offsetTop;
      const duration = 3500;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        const current = start + (end - start) * eased;
        window.scrollTo(0, current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          reverseAnimating.current = false;
          completeFired.current = false;
          hasScrolled.current = false;
          idleFrame.current = 0;
          lastDrawnIndex.current = -1; // Force canvas redraw
          progressRef.current = 0;
        }
      };
      requestAnimationFrame(step);
    };
    return () => {
      if (scrollBackRef) scrollBackRef.current = null;
    };
  }, [scrollBackRef]);

  // Hero text opacity — fade with scroll via ref
  const heroTextRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isReady) return;
    const check = () => {
      const p = progressRef.current;
      if (heroTextRef.current) {
        // Full opacity 0-0.15, fade to 0 by 0.35
        const opacity = p < 0.15 ? 1 : p > 0.35 ? 0 : 1 - (p - 0.15) / 0.2;
        heroTextRef.current.style.opacity = String(Math.max(0, opacity));
      }
      requestAnimationFrame(check);
    };
    const id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [isReady]);

  // Scroll assist: if user stops scrolling in the danger zone (80-95% = black fade),
  // gently auto-complete the scroll to avoid getting stuck on a black screen
  const scrollAssistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isReady) return;
    const onScroll = () => {
      if (scrollAssistTimer.current) clearTimeout(scrollAssistTimer.current);
      scrollAssistTimer.current = setTimeout(() => {
        const p = progressRef.current;
        const section = sectionRef.current;
        if (!section || reverseAnimating.current) return;
        // If stuck in the black-fade zone, auto-scroll to complete
        if (p > 0.80 && p < 0.95) {
          const target = section.offsetTop + section.offsetHeight;
          window.scrollTo({ top: target, behavior: "smooth" });
        }
        // If barely started (under 5%), snap back to top for clean start
        if (p > 0.02 && p < 0.05) {
          window.scrollTo({ top: section.offsetTop, behavior: "smooth" });
        }
      }, 800); // Wait 800ms of no scrolling before assisting
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollAssistTimer.current) clearTimeout(scrollAssistTimer.current);
    };
  }, [isReady]);

  // Scroll hint visibility via ref
  const scrollHintRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isReady) return;
    const check = () => {
      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = progressRef.current < 0.03 ? "1" : "0";
      }
      requestAnimationFrame(check);
    };
    const id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [isReady]);

  if (!isReady) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-deep)",
          gap: "24px",
        }}
      >
        <h1
          className="gradient-text"
          style={{
            fontSize: "clamp(3rem, 10vw, 8rem)",
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          Wolf
        </h1>
        <div
          style={{
            width: "120px",
            height: "2px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "1px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${loadProgress * 100}%`,
              height: "100%",
              background: "rgba(255,255,255,0.4)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: "600vh", position: "relative" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background: "var(--bg-deep)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />

        {/* Hero text overlay */}
        <motion.div
          ref={heroTextRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            position: "absolute",
            left: "5%",
            top: "50%",
            transform: "translateY(-50%)",
            textAlign: "left",
            pointerEvents: "none",
            zIndex: 2,
            maxWidth: isTouch ? "90%" : "auto",
            padding: "24px 32px",
            borderRadius: 12,
            background: "radial-gradient(ellipse at center, rgba(5,5,7,0.6) 0%, transparent 70%)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: 16,
            }}
          >
            Home of Alexander Wolf Pedersen
          </div>
          <h1
            className="gradient-text"
            style={{
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Dive into my brain.
          </h1>
        </motion.div>

        <div
          ref={scrollHintRef}
          style={{
            position: "absolute",
            bottom: "48px",
            left: "50%",
            transform: "translateX(-50%)",
            transition: "opacity 0.6s ease",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Scroll to explore
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="animate-scroll-hint"
          >
            <path
              d="M10 4v12M4 10l6 6 6-6"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

// MobileVideo removed — using canvas frame sequence on all devices
