"use client";

import { useState, useEffect, useRef, useMemo, Suspense, lazy, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeuralNetwork } from "./NeuralNetwork";
import { generateGraph } from "@/lib/neural-graph";
import * as THREE from "three";

const Playground = lazy(() =>
  import("@/components/content/Playground").then((m) => ({ default: m.Playground }))
);
const Work = lazy(() =>
  import("@/components/content/Work").then((m) => ({ default: m.Work }))
);
const Craft = lazy(() =>
  import("@/components/content/Craft").then((m) => ({ default: m.Craft }))
);
const WhoIAm = lazy(() =>
  import("@/components/content/WhoIAm").then((m) => ({ default: m.WhoIAm }))
);
const Connect = lazy(() =>
  import("@/components/content/Connect").then((m) => ({ default: m.Connect }))
);

const CONTENT_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  playground: Playground,
  work: Work,
  craft: Craft,
  "who-i-am": WhoIAm,
  connect: Connect,
};

// View states: overview → zooming-in → content → zooming-out → overview
type ViewState = "overview" | "zooming-in" | "content" | "zooming-out";

interface BrainSectionProps {
  active: boolean;
  onExitBrain?: () => void;
}

export function BrainSection({ active, onExitBrain }: BrainSectionProps) {
  const [viewState, setViewState] = useState<ViewState>("overview");
  const [activeHub, setActiveHub] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const graph = useMemo(() => generateGraph(42), []);

  // Get hub position for zoom target
  const getHubPosition = useCallback(
    (contentKey: string): [number, number, number] | null => {
      const hub = graph.nodes.find(
        (n) => n.type === "hub" && n.contentKey === contentKey
      );
      return hub?.position ?? null;
    },
    [graph]
  );

  // Trigger entrance animation when activated
  useEffect(() => {
    if (active && !entered) {
      const timer = setTimeout(() => setEntered(true), 300);
      return () => clearTimeout(timer);
    }
    if (!active) {
      setEntered(false);
      setActiveHub(null);
      setViewState("overview");
    }
  }, [active, entered]);

  // Lock body scroll when brain is active to prevent Lenis/page scroll conflicts
  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  const onHubClick = useCallback(
    (contentKey: string) => {
      if (viewState !== "overview") return;
      setActiveHub(contentKey);
      setViewState("zooming-in");
    },
    [viewState]
  );

  const onZoomComplete = useCallback(() => {
    setViewState("content");
  }, []);

  const zoomOutFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBackToOverview = useCallback(() => {
    setViewState("zooming-out");
    // Small delay then clear hub — camera zooms back
    setTimeout(() => {
      setActiveHub(null);
    }, 50);
    // Fallback: force overview if zoom-out callback doesn't fire in 3s
    if (zoomOutFallbackRef.current) clearTimeout(zoomOutFallbackRef.current);
    zoomOutFallbackRef.current = setTimeout(() => {
      setViewState("overview");
    }, 3000);
  }, []);

  const onZoomOutComplete = useCallback(() => {
    if (zoomOutFallbackRef.current) clearTimeout(zoomOutFallbackRef.current);
    setViewState("overview");
  }, []);

  const zoomTarget = activeHub ? getHubPosition(activeHub) : null;
  const ActiveContent = activeHub ? CONTENT_MAP[activeHub] : null;
  const hubs = graph.nodes.filter((n) => n.type === "hub");
  const showContent = viewState === "content";
  const showLabels = viewState === "overview";
  const brainRotationRef = useRef({ x: 0, y: 0 });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: active ? 50 : -1,
        opacity: active ? 1 : 0,
        background: "var(--bg-deep)",
        overflow: "hidden",
        pointerEvents: active ? "auto" : "none",
        transition: "opacity 0.6s ease",
      }}
    >
      {/* Three.js neural network — always visible behind everything */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {active && (
          <NeuralNetwork
            onHubClick={onHubClick}
            activeHub={activeHub}
            entered={entered}
            zoomTarget={zoomTarget}
            onZoomComplete={onZoomComplete}
            onZoomOutComplete={onZoomOutComplete}
            brainRotationRef={brainRotationRef}
          />
        )}
      </div>

      {/* Hub labels — only visible in overview */}
      <HubLabelsOverlay
        hubs={hubs}
        onHubClick={onHubClick}
        activeHub={activeHub}
        entered={entered}
        visible={showLabels}
        brainRotationRef={brainRotationRef}
      />

      {/* Back to portrait button — only in overview */}
      <AnimatePresence>
        {showLabels && entered && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 2 }}
            whileHover={{ opacity: 1 }}
            data-hover
            onClick={onExitBrain}
            style={{
              position: "absolute",
              top: "32px",
              left: "32px",
              zIndex: 15,
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "border-color 0.3s, opacity 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
            }
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11 4L6 9l5 5"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full-page content — slides in after zoom */}
      <AnimatePresence>
        {showContent && ActiveContent && (
          <motion.div
            key={activeHub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              background: "rgba(5, 5, 7, 0.85)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              overflow: "hidden",
            }}
          >
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.3 }}
              whileHover={{ opacity: 1 }}
              data-hover
              onClick={onBackToOverview}
              style={{
                position: "fixed",
                top: "32px",
                left: "32px",
                zIndex: 25,
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
              }
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M11 4L6 9l5 5"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>

            {/* Content */}
            <motion.div
              data-lenis-prevent
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                width: "100%",
                maxWidth: activeHub === "playground" || activeHub === "who-i-am" || activeHub === "craft" ? "1100px" : "800px",
                maxHeight: "85vh",
                overflow: "auto",
                overscrollBehavior: "contain",
                padding: "64px 48px",
              }}
            >
              <Suspense
                fallback={
                  <div style={{ color: "var(--text-tertiary)", padding: "24px" }}>
                    Loading...
                  </div>
                }
              >
                <ActiveContent />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// HubLabelButton replaced by HubLabelButtonTracked (below HubLabelsOverlay)

function HubLabelsOverlay({
  hubs,
  onHubClick,
  activeHub,
  entered,
  visible,
  brainRotationRef,
}: {
  hubs: ReturnType<typeof generateGraph>["nodes"];
  onHubClick: (contentKey: string) => void;
  activeHub: string | null;
  entered: boolean;
  visible: boolean;
  brainRotationRef: React.RefObject<{ x: number; y: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rotGroupRef = useRef(new THREE.Group());
  const labelRefsArr = useRef<(HTMLButtonElement | null)[]>([]);

  // Static label data (doesn't change)
  const labelData = useMemo(() =>
    hubs.map(hub => ({
      label: hub.label!,
      contentKey: hub.contentKey!,
      description: hub.description || "",
    })),
    [hubs]
  );

  // Create a persistent camera for projection
  useEffect(() => {
    const aspect = window.innerWidth / window.innerHeight;
    const isMobile = aspect < 1;
    const fov = isMobile ? 65 : 50;
    const z = isMobile ? 14.5 : 8;
    cameraRef.current = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    cameraRef.current.position.set(0, 0, z);
    cameraRef.current.updateMatrixWorld();

    const onResize = () => {
      if (cameraRef.current) {
        const newAspect = window.innerWidth / window.innerHeight;
        const newMobile = newAspect < 1;
        cameraRef.current.aspect = newAspect;
        cameraRef.current.fov = newMobile ? 65 : 50;
        cameraRef.current.position.z = newMobile ? 14.5 : 8;
        cameraRef.current.updateProjectionMatrix();
        cameraRef.current.updateMatrixWorld();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Update label positions + staggered opacity via DOM directly
  const enteredTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const update = () => {
      if (!cameraRef.current) { raf = requestAnimationFrame(update); return; }

      // Track when entered becomes true
      if (entered && enteredTimeRef.current === null) {
        enteredTimeRef.current = performance.now();
      }
      if (!entered) {
        enteredTimeRef.current = null;
      }

      const rot = brainRotationRef.current!;
      const group = rotGroupRef.current;
      group.rotation.set(rot.x, rot.y, 0);
      group.updateMatrixWorld();

      const elapsed = enteredTimeRef.current !== null
        ? (performance.now() - enteredTimeRef.current) / 1000
        : -1;

      hubs.forEach((hub, i) => {
        const el = labelRefsArr.current[i];
        if (!el) return;

        // Position tracking
        const vec = new THREE.Vector3(...hub.position);
        vec.applyMatrix4(group.matrixWorld);
        vec.project(cameraRef.current!);
        const x = ((vec.x + 1) / 2) * 100;
        const y = ((-vec.y + 1) / 2) * 100;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;

        // Staggered opacity: each label fades in 1s after its hub dot
        // Hub dots appear at 0, 1, 2, 3, 4s. Labels at 1, 2, 3, 4, 5s.
        if (entered && visible) {
          const delay = i * 1.0 + 1.0;
          const fadeDur = 1.0;
          const raw = Math.max(0, Math.min(1, (elapsed - delay) / fadeDur));
          const eased = 1 - Math.pow(1 - raw, 2);
          el.style.opacity = String(eased * 0.85);
          el.style.pointerEvents = eased > 0.5 ? "auto" : "none";
        } else {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
      });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [hubs, entered, visible, brainRotationRef]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {labelData.map((data, i) => (
        <HubLabelButtonTracked
          key={data.contentKey}
          ref={(el) => { labelRefsArr.current[i] = el; }}
          data={data}
          index={i}
          entered={entered}
          visible={visible}
          onHubClick={onHubClick}
        />
      ))}
    </div>
  );
}

// Label button that receives position via ref (DOM updates), not props (React re-renders)

const HubLabelButtonTracked = forwardRef<
  HTMLButtonElement,
  {
    data: { label: string; contentKey: string; description: string };
    index: number;
    entered: boolean;
    visible: boolean;
    onHubClick: (contentKey: string) => void;
  }
>(function HubLabelButtonTracked({ data, index, entered, visible, onHubClick }, ref) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      ref={ref}
      data-hover
      className="hub-label"
      onClick={() => onHubClick(data.contentKey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, 10px)",
        pointerEvents: "none",
        opacity: 0,
        transition: "background 0.3s ease",
        background: hovered ? "rgba(255,255,255,0.03)" : "none",
        border: "none",
        borderRadius: 8,
        padding: "8px 14px",
        whiteSpace: "nowrap",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontWeight: 500 }}>{data.label}</span>
      <span
        style={{
          fontSize: 10,
          letterSpacing: "0.06em",
          textTransform: "none" as const,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        {data.description}
      </span>
    </button>
  );
});
