"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PortraitScrollSection } from "@/components/hero/PortraitScrollSection";
import { BrainSection } from "@/components/brain/BrainSection";

export default function Home() {
  const [brainActive, setBrainActive] = useState(false);
  const [brainPrewarm, setBrainPrewarm] = useState(false);
  const scrollBackRef = useRef<(() => void) | null>(null);

  // Deep link straight into the brain (also used for headless verification,
  // where the hero video can't play)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("brain") === "1") {
      setBrainActive(true);
    }
  }, []);

  const onExitBrain = useCallback(() => {
    setBrainActive(false);
    setTimeout(() => {
      scrollBackRef.current?.();
    }, 650);
  }, []);

  return (
    <main style={{ background: "var(--bg-deep)" }}>
      <PortraitScrollSection
        onSequenceComplete={() => setBrainActive(true)}
        onSequenceStart={() => setBrainPrewarm(true)}
        scrollBackRef={scrollBackRef}
      />
      <BrainSection
        active={brainActive}
        prewarm={brainPrewarm}
        onExitBrain={onExitBrain}
      />
    </main>
  );
}
