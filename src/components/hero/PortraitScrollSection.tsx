"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface Props {
  onSequenceComplete?: () => void;
  scrollBackRef?: React.MutableRefObject<(() => void) | null>;
}

type Phase = "idle" | "playing" | "completed" | "reversing";

export function PortraitScrollSection({ onSequenceComplete, scrollBackRef }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const idleVideoRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const reverseVideoRef = useRef<HTMLVideoElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const fadeOverlayRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const [isReady, setIsReady] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const isMobile = useIsMobile();

  // --- Loading: wait for idle clip ---
  useEffect(() => {
    const idle = idleVideoRef.current;
    if (!idle) return;

    const markReady = () => {
      if (!isReady) setIsReady(true);
    };

    if (idle.readyState >= 3) {
      markReady();
    } else {
      idle.addEventListener("canplaythrough", markReady, { once: true });
    }
    const fallback = setTimeout(markReady, 2500);

    return () => {
      idle.removeEventListener("canplaythrough", markReady);
      clearTimeout(fallback);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Ensure idle video plays (autoplay fallback) ---
  useEffect(() => {
    if (!isReady) return;
    const idle = idleVideoRef.current;
    if (!idle) return;

    const tryPlay = () => {
      if (idle.paused && phaseRef.current === "idle") {
        idle.play().catch(() => {});
      }
    };

    tryPlay();
    const t = setTimeout(tryPlay, 300);

    const onInteract = () => {
      tryPlay();
      document.removeEventListener("touchstart", onInteract);
      document.removeEventListener("click", onInteract);
    };
    document.addEventListener("touchstart", onInteract, { once: true, passive: true });
    document.addEventListener("click", onInteract, { once: true });

    return () => {
      clearTimeout(t);
      document.removeEventListener("touchstart", onInteract);
      document.removeEventListener("click", onInteract);
    };
  }, [isReady, resetCount]);

  // --- Scroll trigger: first scroll plays the full video ---
  useEffect(() => {
    if (!isReady || phaseRef.current !== "idle") return;
    const section = sectionRef.current;
    const mainVideo = mainVideoRef.current;
    const idleVideo = idleVideoRef.current;
    if (!section || !mainVideo) return;

    const trigger = (e: Event) => {
      if (phaseRef.current !== "idle") return;
      if (e instanceof WheelEvent && Math.abs(e.deltaY) < 3) return;

      phaseRef.current = "playing";
      document.body.style.overflow = "hidden";

      // Hide idle, show + play main
      if (idleVideo) {
        idleVideo.pause();
        idleVideo.style.opacity = "0";
      }
      mainVideo.style.opacity = "1";
      mainVideo.currentTime = 0;
      mainVideo.play().catch(() => {});

      // Fade hero text + scroll hint
      if (heroTextRef.current) {
        heroTextRef.current.style.transition = "opacity 0.8s ease";
        heroTextRef.current.style.opacity = "0";
      }
      if (scrollHintRef.current) {
        scrollHintRef.current.style.transition = "opacity 0.4s ease";
        scrollHintRef.current.style.opacity = "0";
      }

      section.removeEventListener("wheel", trigger);
      section.removeEventListener("touchstart", trigger);
    };

    section.addEventListener("wheel", trigger, { passive: true });
    section.addEventListener("touchstart", trigger, { passive: true });

    return () => {
      section.removeEventListener("wheel", trigger);
      section.removeEventListener("touchstart", trigger);
    };
  }, [isReady, resetCount]);

  // --- Fade-to-black + completion on main video end ---
  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    let rafId: number;
    const tick = () => {
      if (phaseRef.current === "playing" && video.duration) {
        const progress = video.currentTime / video.duration;
        const FADE_START = 0.80;
        if (fadeOverlayRef.current) {
          fadeOverlayRef.current.style.opacity =
            progress > FADE_START
              ? String(Math.min(1, (progress - FADE_START) / (1 - FADE_START)))
              : "0";
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onEnded = () => {
      if (phaseRef.current !== "playing") return;
      phaseRef.current = "completed";
      if (fadeOverlayRef.current) fadeOverlayRef.current.style.opacity = "1";
      document.body.style.overflow = "";
      onSequenceComplete?.();
    };

    video.addEventListener("ended", onEnded);
    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("ended", onEnded);
    };
  }, [onSequenceComplete]);

  // --- Reverse: play the animation backwards, then show idle ---
  useEffect(() => {
    if (!scrollBackRef) return;

    scrollBackRef.current = () => {
      const mainVideo = mainVideoRef.current;
      const reverseVideo = reverseVideoRef.current;
      const idleVideo = idleVideoRef.current;
      const fade = fadeOverlayRef.current;
      if (!mainVideo || !reverseVideo || !fade) return;

      phaseRef.current = "reversing";
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";

      // Hide main video, show reverse video on top
      mainVideo.pause();
      mainVideo.currentTime = 0;
      mainVideo.style.opacity = "0";

      reverseVideo.style.opacity = "1";
      reverseVideo.currentTime = 0;
      reverseVideo.play().catch(() => {});

      // Fade-from-black: lift the black overlay to reveal the reverse video
      setTimeout(() => {
        fade.style.transition = "opacity 0.6s ease";
        fade.style.opacity = "0";
      }, 50);

      // When reverse video ends, switch to idle
      const onReverseEnd = () => {
        reverseVideo.removeEventListener("ended", onReverseEnd);

        // Hide reverse, show idle
        reverseVideo.style.opacity = "0";
        reverseVideo.pause();
        reverseVideo.currentTime = 0;

        if (idleVideo) {
          idleVideo.style.transition = "none";
          idleVideo.style.opacity = "1";
          idleVideo.currentTime = 0;
          idleVideo.play().catch(() => {});
        }

        phaseRef.current = "idle";
        document.body.style.overflow = "";

        // Restore hero text + scroll hint
        if (heroTextRef.current) {
          heroTextRef.current.style.transition = "opacity 0.5s ease";
          heroTextRef.current.style.opacity = "1";
        }
        if (scrollHintRef.current) {
          scrollHintRef.current.style.transition = "opacity 0.5s ease 0.2s";
          scrollHintRef.current.style.opacity = "1";
        }

        // Re-arm scroll trigger
        setTimeout(() => setResetCount((c) => c + 1), 300);
      };

      reverseVideo.addEventListener("ended", onReverseEnd);
    };

    return () => {
      if (scrollBackRef) scrollBackRef.current = null;
    };
  }, [scrollBackRef]);

  // --- Fade overlay tracking for reverse video (fade back to black at end) ---
  useEffect(() => {
    const reverseVideo = reverseVideoRef.current;
    if (!reverseVideo) return;

    let rafId: number;
    const tick = () => {
      if (phaseRef.current === "reversing" && reverseVideo.duration) {
        const progress = reverseVideo.currentTime / reverseVideo.duration;
        // No fade-to-black on reverse — it ends with the portrait visible
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-deep)",
      }}
    >
      {/* Idle video — looping blink/breathing */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={idleVideoRef}
        src="/hero-idle.mp4"
        muted
        autoPlay
        playsInline
        loop
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Main video — forward animation */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={mainVideoRef}
        src="/hero-video.mp4"
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0,
          transition: "opacity 0.15s ease",
        }}
      />

      {/* Reverse video — backward animation for backtrack */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={reverseVideoRef}
        src="/hero-reverse.mp4"
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0,
          zIndex: 1,
        }}
      />

      {/* Fade-to-black overlay */}
      <div
        ref={fadeOverlayRef}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--bg-deep)",
          opacity: 0,
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* Loading screen */}
      {!isReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-deep)",
            zIndex: 10,
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
              marginTop: "24px",
            }}
          >
            <div
              className="animate-pulse"
              style={{
                width: "40%",
                height: "100%",
                background: "rgba(255,255,255,0.4)",
              }}
            />
          </div>
        </div>
      )}

      {/* Hero text */}
      {isReady && (
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
            maxWidth: isMobile ? "90%" : "auto",
            padding: isMobile ? "16px 20px" : "24px 32px",
            borderRadius: 12,
            textShadow: isMobile
              ? "0 2px 12px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.6)"
              : "0 1px 8px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: isMobile ? 8 : 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: isMobile ? 6 : 16,
              lineHeight: 1.6,
            }}
          >
            Home of{isMobile ? <br /> : " "}Alexander Wolf Pedersen
          </div>
          <h1
            className="gradient-text"
            style={{
              fontSize: isMobile
                ? "clamp(1.2rem, 5vw, 1.8rem)"
                : "clamp(2rem, 5vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              whiteSpace: isMobile ? "normal" : "nowrap",
            }}
          >
            Dive into my brain.
          </h1>
        </motion.div>
      )}

      {/* Scroll hint */}
      {isReady && (
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
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
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
      )}
    </section>
  );
}
