"use client";

import {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  RoomScene,
  type RegionScreen,
  type RoomApi,
} from "./RoomScene";
import { Tether, HudTrace } from "./RecallConsole";
import { STATIONS } from "@/lib/room-world";
import {
  createWalk,
  resetWalk,
  cutToStation,
  bindWalkKeys,
} from "@/hooks/useRoomWalk";
import {
  useIsTouchDevice,
  usePrefersReducedMotion,
} from "@/hooks/useMediaQuery";

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

// The Operator's Room: walk (WASD/joystick/drag-look) around a mission
// control room inside the head; stations open docked panels. Station
// jumps are instant broadcast CUTS (140ms static flicker), never eased
// camera paths — the comfort contract from three prior iterations.
type ViewState = "entering" | "roaming" | "open";

interface BrainSectionProps {
  active: boolean;
  /** mount the 3D scene early (hidden) so entering is an instant cut */
  prewarm?: boolean;
  onExitBrain?: () => void;
}

declare global {
  interface Window {
    __brain?: {
      state: () => ViewState;
      open: () => number | null;
      focus: () => number;
      pos: () => [number, number, number];
      yaw: () => number;
      cut: (station: number) => void;
      openStation: (station: number) => void;
      close: () => void;
      screens: () => RegionScreen[];
      setKeys: (codes: string[]) => void;
    };
  }
}

// Panel anchor (viewport %) for the tether; follows the CSS 768px breakpoint
function panelAnchor(sheet: boolean): { x: number; y: number } {
  return sheet ? { x: 50, y: 35 } : { x: 57, y: 38 };
}

export function BrainSection({ active, prewarm, onExitBrain }: BrainSectionProps) {
  const [viewState, setViewState] = useState<ViewState>("entering");
  const [openRegion, setOpenRegion] = useState<number | null>(null);
  const [focusedRegion, setFocusedRegion] = useState<number | null>(null);
  const [entered, setEntered] = useState(false);
  const [everActive, setEverActive] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [forceReduced, setForceReduced] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  // cut flicker: increments to replay the 140ms static animation
  const [cutStamp, setCutStamp] = useState(0);

  // ?touch=1 forces the touch controls (test the mobile UI on a desktop)
  const [forceTouch, setForceTouch] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("touch") === "1") {
      setForceTouch(true);
    }
  }, []);
  const isTouch = useIsTouchDevice() || forceTouch;
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = prefersReduced || forceReduced;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  const walkRef = useRef(createWalk());
  const regionScreenRef = useRef<RegionScreen[]>(
    STATIONS.map(() => ({ x: 50, y: 50, visible: false, dist: Infinity }))
  );
  const apiRef = useRef<RoomApi | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;
  const activeRef = useRef(active);
  activeRef.current = active;
  const openRegionRef = useRef<number | null>(null);

  // ---- lifecycle ----
  useEffect(() => {
    if (active) setEverActive(true);
    if (active && !entered) {
      // portrait spawns further back so the whole quickstart fits the frame
      if (window.innerHeight > window.innerWidth) {
        walkRef.current.pos.z = 2.55;
      }
      const timer = setTimeout(() => setEntered(true), 300);
      return () => clearTimeout(timer);
    }
    if (!active) {
      setEntered(false);
      setViewState("entering");
      setOpenRegion(null);
      setFocusedRegion(null);
      openRegionRef.current = null;
      setVisited(new Set());
      resetWalk(walkRef.current);
      apiRef.current?.reset();
    }
  }, [active, entered]);

  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reduced") === "1") {
      setForceReduced(true);
    }
  }, []);

  // sheet layout tracks the CSS breakpoint, live
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setSheet(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ---- transitions ----
  const onSettled = useCallback(() => {
    // the drop + beam start the moment the cover lifts (idempotent, so
    // StrictMode's double-invoked updater is harmless)
    if (!reducedMotionRef.current) walkRef.current.spawnT = 0;
    setViewState((vs) => (vs === "entering" ? "roaming" : vs));
  }, []);

  const onFocus = useCallback((station: number) => {
    setFocusedRegion(station);
  }, []);
  const onDefocus = useCallback(() => {
    setFocusedRegion(null);
  }, []);

  const openContent = useCallback((station: number) => {
    setOpenRegion(station);
    openRegionRef.current = station;
    setViewState("open");
    walkRef.current.mode = "locked";
    walkRef.current.keys.clear();
    walkRef.current.joy.x = 0;
    walkRef.current.joy.y = 0;
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(station);
      return next;
    });
  }, []);


  const onClosePanel = useCallback(() => {
    setOpenRegion(null);
    openRegionRef.current = null;
    walkRef.current.mode = "free";
    setViewState("roaming");
  }, []);

  // Escape closes the panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!activeRef.current) return;
      if (e.code === "Escape" && viewStateRef.current === "open") onClosePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClosePanel]);

  // walk keys (Enter unbound: the quickstart screen is the only doorway)
  useEffect(() => {
    return bindWalkKeys(
      walkRef.current,
      () => activeRef.current && viewStateRef.current === "roaming"
    );
  }, []);

  // dialog focus management
  const prevViewStateRef = useRef<ViewState>("entering");
  useEffect(() => {
    const prev = prevViewStateRef.current;
    prevViewStateRef.current = viewState;
    if (viewState === "open" && openRegion !== null) {
      panelRef.current?.focus({ preventScroll: true });
    } else if (viewState === "roaming" && prev === "open" && !isTouch) {
      document
        .querySelector<HTMLDivElement>("[data-brain-canvas]")
        ?.focus({ preventScroll: true });
    }
  }, [viewState, openRegion, isTouch]);

  // dev debug hook
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const walk = walkRef.current;
    window.__brain = {
      state: () => viewStateRef.current,
      open: () => openRegionRef.current,
      focus: () => walk.focusIndex,
      pos: () => [walk.pos.x, walk.pos.y, walk.pos.z],
      yaw: () => walk.yaw,
      cut: (i: number) => {
        cutToStation(walk, i);
        setCutStamp((s) => s + 1);
      },
      openStation: (i: number) => openContent(i),
      close: () => onClosePanel(),
      screens: () => regionScreenRef.current,
      setKeys: (codes: string[]) => {
        walk.keys.clear();
        codes.forEach((c) => walk.keys.add(c));
      },
    };
    return () => {
      delete window.__brain;
    };
  }, [openContent, onClosePanel]);

  const anchor = panelAnchor(sheet);
  const activeContentKey =
    openRegion !== null ? STATIONS[openRegion].contentKey : null;
  const ActiveContent = activeContentKey ? CONTENT_MAP[activeContentKey] : null;
  const showChrome = entered && viewState !== "entering";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: active ? 50 : -1,
        opacity: active ? 1 : 0,
        visibility: active ? "visible" : "hidden",
        background: "var(--bg-deep)",
        overflow: "hidden",
        pointerEvents: active ? "auto" : "none",
        transition: active
          ? "opacity 0.6s ease, visibility 0s"
          : "opacity 0.6s ease, visibility 0s linear 0.6s",
      }}
    >
      {/* The room — also mounted during prewarm (hidden, frameloop off):
          context, geometry and textures build while the hero video plays */}
      {webglOk && (everActive || prewarm) && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <RoomScene
            active={active}
            entered={entered}
            reducedMotion={reducedMotion}
            walk={walkRef.current}
            regionScreenRef={regionScreenRef}
            apiRef={apiRef}
            onSettled={onSettled}
            onFocus={onFocus}
            onDefocus={onDefocus}
            onOpenSection={openContent}
          />
        </div>
      )}

      {/* No-WebGL fallback */}
      {!webglOk && active && (
        <BrainFallbackLazy
          onRegionOpen={(i) => {
            setOpenRegion(i);
            openRegionRef.current = i;
            setViewState("open");
          }}
        />
      )}

      {/* Tether from panel to station */}
      {webglOk && (
        <Tether
          regionIndex={openRegion !== null ? 0 : null}
          regionScreenRef={regionScreenRef}
          anchor={openRegion !== null ? anchor : null}
        />
      )}

      {/* HUD feed line while a panel is open */}
      {webglOk && <HudTrace regionIndex={openRegion} />}

      {/* Broadcast-cut flicker */}
      {cutStamp > 0 && !reducedMotion && (
        <div key={cutStamp} className="feed-cut" aria-hidden />
      )}

      {/* Game-style spawn sequence */}
      {webglOk && (
        <SpawnSequence
          active={showChrome}
          covering={active}
          isTouch={isTouch}
          walk={walkRef.current}
        />
      )}

      {/* Touch joystick */}
      {webglOk && isTouch && showChrome && viewState !== "open" && (
        <VirtualJoystick walk={walkRef.current} />
      )}

      {/* Back to portrait button */}
      <AnimatePresence>
        {(showChrome || (!webglOk && active)) && (
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

      {/* The old man in the corner (off-ramp to /classic) */}
      <AnimatePresence>
        {(showChrome || (!webglOk && active)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // the welcome line owns the spawn moment; he shuffles in after
            transition={{ duration: 0.7, delay: webglOk ? 8.6 : 0.5 }}
          >
            <OldManEscape isTouch={isTouch} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked content panel — the room stays visible beside it */}
      <AnimatePresence>
        {viewState === "open" && (
          <motion.div
            key="panel-backdrop"
            className="recall-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClosePanel}
            aria-hidden
          />
        )}
        {viewState === "open" && ActiveContent && (
          <motion.div
            key={activeContentKey}
            data-lenis-prevent
            className="recall-panel"
            role="dialog"
            aria-modal="true"
            aria-label={openRegion !== null ? STATIONS[openRegion].label : undefined}
            tabIndex={-1}
            ref={panelRef}
            initial={{ opacity: 0, x: sheet ? 0 : 60, y: sheet ? 60 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: sheet ? 0 : 40, y: sheet ? 40 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="recall-panel-head">
              <span className="recall-panel-title">
                {STATIONS[openRegion!].number} · {STATIONS[openRegion!].label}
              </span>
              <button
                data-hover
                className="recall-panel-close"
                aria-label="Close"
                onClick={onClosePanel}
              >
                ✕
              </button>
            </div>
            <div className="recall-panel-body">
              <Suspense
                fallback={
                  <div style={{ color: "var(--text-tertiary)", padding: "24px" }}>
                    Loading...
                  </div>
                }
              >
                <ActiveContent />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========================= SPAWN SEQUENCE =========================

// Game-style spawn: materialize (iris + scanline sweep + flicker), then a
// single big line fading in and out. A one-line control hint appears only
// if the visitor still hasn't moved afterwards.

function SpawnSequence({
  active,
  covering,
  isTouch,
  walk,
}: {
  active: boolean;
  /** section is on screen: hold an opaque cover until the fx take over */
  covering: boolean;
  isTouch: boolean;
  walk: ReturnType<typeof createWalk>;
}) {
  const [phase, setPhase] = useState<"idle" | "fx" | "line" | "hint" | "done">("idle");

  // plays on every entry, like a respawn; fully restartable so React
  // StrictMode's double-run can't strand it mid-phase
  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }
    setPhase("fx");
    const t1 = setTimeout(() => setPhase("line"), 1600);
    const t2 = setTimeout(() => setPhase("hint"), 7600);
    const t3 = setTimeout(() => setPhase("done"), 21000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active]);

  // the hint dismisses as soon as the visitor moves
  useEffect(() => {
    if (phase !== "hint") return;
    const poll = setInterval(() => {
      if (walk.hasMoved) setPhase("done");
    }, 250);
    return () => clearInterval(poll);
  }, [phase, walk]);

  return (
    <>
      {/* the room must never flash in raw before the spawn plays */}
      {covering && phase === "idle" && (
        <div className="spawn-cover" aria-hidden />
      )}
      {(phase === "fx" || phase === "line") && (
        <div className="spawn-fx" aria-hidden>
          <div className="spawn-black" />
          <div className="spawn-scan" />
          <div className="spawn-flash" />
        </div>
      )}
      {phase === "line" && (
        <div className="welcome-line" role="status">
          welcome to the inside of <span>Alexander&rsquo;s brain</span>
        </div>
      )}
      <AnimatePresence>
        {phase === "hint" && !walk.hasMoved && (
          <motion.div
            className="move-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {isTouch
              ? "joystick to walk · drag to look"
              : "arrow keys to walk & turn · drag to look · double-click the floor to travel"}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ========================= OLD MAN (off-ramp to /classic) =========================

// A small caricature in the corner. Hover him and he grumbles about the
// good old days; click takes you to the basic website.

function OldManEscape({ isTouch }: { isTouch: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <div className="old-man">
      <Link
        href="/classic"
        data-hover
        aria-label="Take me to a basic website"
        className={"old-man-link" + (armed ? " old-man-armed" : "")}
        onClick={(e) => {
          // touch has no hover: first tap shows the grumble, second follows
          if (isTouch && !armed) {
            e.preventDefault();
            setArmed(true);
          }
        }}
      >
        <span className="old-man-bubble" aria-hidden>
          &ldquo;what happened to the good old days?&rdquo;
        </span>
        <svg viewBox="0 0 64 88" width="52" height="72" fill="none" aria-hidden>
          <defs>
            <linearGradient id="omCardigan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6e7862" />
              <stop offset="1" stopColor="#4e5745" />
            </linearGradient>
            <linearGradient id="omCap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9a6c42" />
              <stop offset="1" stopColor="#754f2c" />
            </linearGradient>
          </defs>
          {/* cane behind the body */}
          <path d="M51 55 Q56 52.5 55.5 58 L53 84" stroke="#a3763f" strokeWidth="2.8" strokeLinecap="round" />
          {/* cardigan */}
          <path d="M24 51 Q13.5 57 15.5 82 L48.5 82 Q50.5 57 40 51 Z" fill="url(#omCardigan)" stroke="#3b4234" strokeWidth="1" />
          <path d="M29 51 L32 59 L35 51 Z" fill="#e9e6da" />
          <path d="M26.5 51.5 L31 60.5 L27 63 Z M37.5 51.5 L33 60.5 L37 63 Z" fill="#414a39" />
          <circle cx="32" cy="65" r="1.2" fill="#2f362a" />
          <circle cx="32" cy="71" r="1.2" fill="#2f362a" />
          {/* neck + head */}
          <path d="M28 43 L36 43 L36 52 L28 52 Z" fill="#d9a377" />
          <ellipse cx="32" cy="31" rx="12.5" ry="13.5" fill="#eec39a" />
          <path d="M39 20 Q45 27 43.5 37 Q42 42.5 38 44.5 Q43 37 41 27 Z" fill="#dda87c" opacity="0.7" />
          <circle cx="19.5" cy="31.5" r="3" fill="#eec39a" stroke="#d29a6f" strokeWidth="0.8" />
          <circle cx="44.5" cy="31.5" r="3" fill="#eec39a" stroke="#d29a6f" strokeWidth="0.8" />
          {/* white side tufts */}
          <ellipse cx="19.8" cy="26" rx="2.8" ry="3.4" fill="#eef1f7" />
          <ellipse cx="44.2" cy="26" rx="2.8" ry="3.4" fill="#eef1f7" />
          {/* beard + mustache */}
          <path d="M22.5 40 Q22.5 50 32 53 Q41.5 50 41.5 40 Q37.5 47 32 47 Q26.5 47 22.5 40 Z" fill="#e7ebf3" />
          <path d="M32 41.5 Q26 39.8 23.2 43.6 Q26.8 47.3 32 45.4 Q37.2 47.3 40.8 43.6 Q38 39.8 32 41.5 Z" fill="#f5f7fb" stroke="#ccd3e0" strokeWidth="0.6" />
          {/* nose */}
          <path d="M32 28.5 Q28.6 36.5 31.2 39.6 Q33.6 41.4 35.2 39.2 Q35.6 33.5 32 28.5 Z" fill="#e2a878" stroke="#c98d63" strokeWidth="0.8" />
          {/* eyes + glasses */}
          <circle cx="26.5" cy="30.5" r="1.4" fill="#2a2e38" />
          <circle cx="37.5" cy="30.5" r="1.4" fill="#2a2e38" />
          <circle cx="26.5" cy="30" r="4.2" fill="rgba(170,195,235,0.15)" stroke="#c2c9d8" strokeWidth="1.2" />
          <circle cx="37.5" cy="30" r="4.2" fill="rgba(170,195,235,0.15)" stroke="#c2c9d8" strokeWidth="1.2" />
          <path d="M30.7 30 L33.3 30 M22.3 29.5 L19.5 28.8 M41.7 29.5 L44.5 28.8" stroke="#c2c9d8" strokeWidth="1.2" strokeLinecap="round" />
          {/* bushy white brows */}
          <path d="M21.8 26.3 Q26 23.6 30.2 25.6 M33.8 25.6 Q38 23.6 42.2 26.3" stroke="#f4f6fa" strokeWidth="2.8" strokeLinecap="round" />
          {/* flat cap */}
          <path d="M18.5 21 Q21 8.5 32 8.5 Q43 8.5 45.5 21 Q32 16.5 18.5 21 Z" fill="url(#omCap)" stroke="#5c3e22" strokeWidth="0.8" />
          <path d="M17 21.8 Q32 15.8 47 21.8 L45 24.6 Q32 19.8 19 24.6 Z" fill="#6a4527" />
          <circle cx="32" cy="9.6" r="1.3" fill="#5c3e22" />
        </svg>
        <span className="old-man-tip" role="tooltip">
          &ldquo;What happened to the good old days&hellip;&rdquo;
          <em>take me to a basic website &rarr;</em>
        </span>
      </Link>
    </div>
  );
}

// ========================= TOUCH JOYSTICK =========================

function VirtualJoystick({ walk }: { walk: ReturnType<typeof createWalk> }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);

  const setJoy = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    const knob = knobRef.current;
    if (!base || !knob) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = rect.width / 2 - 18;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    walk.joy.x = dx / max;
    walk.joy.y = dy / max;
    walk.hasMoved = true;
  };

  const clear = () => {
    activePointer.current = null;
    walk.joy.x = 0;
    walk.joy.y = 0;
    if (knobRef.current) {
      knobRef.current.style.transform = "translate(-50%, -50%)";
    }
  };

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onPointerDown={(e) => {
        activePointer.current = e.pointerId;
        try {
          baseRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // synthetic or already-released pointers can't be captured
        }
        setJoy(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointer.current === e.pointerId) setJoy(e.clientX, e.clientY);
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
    >
      <div ref={knobRef} className="joystick-knob" />
    </div>
  );
}

const BrainFallbackInner = lazy(() =>
  import("./BrainFallback").then((m) => ({ default: m.BrainFallback }))
);

function BrainFallbackLazy({
  onRegionOpen,
}: {
  onRegionOpen: (regionIndex: number) => void;
}) {
  return (
    <Suspense fallback={null}>
      <BrainFallbackInner onRegionOpen={onRegionOpen} />
    </Suspense>
  );
}
