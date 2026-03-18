"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Poll for lenis instance, then bind ScrollTrigger.update
    let scrollCleanup: (() => void) | null = null;
    const interval = setInterval(() => {
      const lenis = lenisRef.current?.lenis;
      if (lenis) {
        clearInterval(interval);
        lenis.on("scroll", ScrollTrigger.update);
        scrollCleanup = () => lenis.off("scroll", ScrollTrigger.update);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      gsap.ticker.remove(update);
      scrollCleanup?.();
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.08, duration: 1.4, smoothWheel: true }}
    >
      {children}
    </ReactLenis>
  );
}
