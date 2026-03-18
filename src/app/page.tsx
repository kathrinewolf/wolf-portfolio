"use client";

import { useState, useCallback, useRef } from "react";
import { PortraitScrollSection } from "@/components/hero/PortraitScrollSection";
import { BrainSection } from "@/components/brain/BrainSection";

export default function Home() {
  const [brainActive, setBrainActive] = useState(false);
  const scrollBackRef = useRef<(() => void) | null>(null);

  const onExitBrain = useCallback(() => {
    // 1. Fade out brain overlay (0.6s CSS transition)
    setBrainActive(false);
    // 2. After fade completes, smooth-scroll the hero animation in reverse
    setTimeout(() => {
      scrollBackRef.current?.();
    }, 650);
  }, []);

  return (
    <main style={{ background: "var(--bg-deep)" }}>
      <PortraitScrollSection
        onSequenceComplete={() => setBrainActive(true)}
        scrollBackRef={scrollBackRef}
      />
      <BrainSection active={brainActive} onExitBrain={onExitBrain} />
    </main>
  );
}
