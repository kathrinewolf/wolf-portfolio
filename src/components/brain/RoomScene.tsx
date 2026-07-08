"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, advance, events as createEvents } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  STATIONS,
  SPAWN_POS,
  ROOM_HALF_X,
  ROOM_HALF_Z,
  ROOM_HEIGHT,
  WINDOW,
  type RoomStation,
} from "@/lib/room-world";
import { generateInteriorWorld } from "@/lib/interior-world";
import { stepWalk, EYE, type WalkState } from "@/hooks/useRoomWalk";
import { FirstPersonBody } from "./CharacterRig";
import { BrainSign, GymCorner } from "./RoomPersona";
import { RoomZones } from "./RoomZones";
import {
  makeFloorMaps,
  makeWallMaps,
  makeBrushedRoughness,
} from "@/lib/room-textures";
import { RoomDressing } from "./RoomDressing";

// The Operator's Room — a walkable mission-control room inside the head.
// Unlit materials + glow edge-lines + emissive monospace screens, and a
// panoramic window onto the neural storm (the volumetric brain field).
// The camera moves ONLY from user input; station jumps are instant cuts.

export interface RegionScreen {
  x: number;
  y: number;
  visible: boolean;
  dist: number;
}

export interface RoomApi {
  reset: () => void;
}

declare global {
  interface Window {
    /** dev-only: step the r3f loop deterministically (headless verification) */
    __brainStep?: (frames?: number) => void;
    /** dev-only: run one DOM-overlay label sync */
    __brainSyncOverlay?: () => void;
  }
}

// ========================= PALETTE =========================

const COL_FLOOR = new THREE.Color("#0b0d13");
const COL_WALL = new THREE.Color("#0e1019");
const COL_FURNITURE = new THREE.Color("#131624");
const COL_EDGE = new THREE.Color(0.62, 0.7, 0.95);
const COL_SCREEN_GLOW = "rgba(178, 196, 232, 0.92)";
const COL_SCREEN_DIM = "rgba(178, 196, 232, 0.45)";
const COL_SCREEN_BG = "#0b0e16";

// ========================= LINE SHADER (glow edges) =========================

const lineVert = `
  uniform float uFogK;
  uniform float uAlpha;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float d = length(mv.xyz);
    vAlpha = uAlpha * exp(-d * d * uFogK);
    gl_Position = projectionMatrix * mv;
  }
`;
const lineFrag = `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor * vAlpha, vAlpha);
  }
`;

function edgeMaterial(alpha: number, fogK = 0.004) {
  return new THREE.ShaderMaterial({
    vertexShader: lineVert,
    fragmentShader: lineFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: COL_EDGE },
      uAlpha: { value: alpha },
      uFogK: { value: fogK },
    },
  });
}

// ========================= POINT SHADER (window field + dust) =========================

const pointVert = `
  uniform float uTime;
  uniform float uMotion;
  uniform float uSwell;
  uniform float uFogK;
  uniform float uPerspK;
  attribute float aSeed;
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  void main() {
    vec3 dir = normalize(position + vec3(0.0, 0.001, 0.0));
    float wob = sin(aSeed + uTime * 0.15 + position.x * 0.2)
              + 0.5 * sin(aSeed * 1.7 + uTime * 0.23 + position.z * 0.15);
    vec3 p = position + dir * wob * 0.3 * uMotion;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float d = length(mv.xyz);
    float fog = exp(-d * d * uFogK);
    float nearFade = smoothstep(0.25, 1.2, d);
    float twinkle = 1.0 + 0.15 * sin(uTime * 0.6 + aSeed * 3.0) * uMotion;
    vBrightness = aBrightness * fog * nearFade * twinkle * (0.35 + 0.65 * uSwell);
    gl_PointSize = min(aSize * (0.6 + 0.4 * uSwell) * (uPerspK / -mv.z), 48.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFrag = `
  uniform vec3 uColor;
  varying float vBrightness;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float core = smoothstep(0.08, 0.0, d);
    float inner = exp(-d * d * 20.0) * 0.7;
    float outer = exp(-d * d * 3.0) * 0.12;
    float intensity = (core + inner + outer) * vBrightness;
    gl_FragColor = vec4(uColor * intensity, intensity);
  }
`;

function pointsMaterial(fogK: number, perspK: number) {
  return new THREE.ShaderMaterial({
    vertexShader: pointVert,
    fragmentShader: pointFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uSwell: { value: 1 },
      uFogK: { value: fogK },
      uPerspK: { value: perspK },
      uColor: { value: new THREE.Color(0.75, 0.82, 1.0) },
    },
  });
}

// ========================= SPAWN BEAM =========================

// Game-spawn beam at the spawn point: a light pillar, expanding floor
// rings and a landing burst, timed to the camera drop (walk.spawnT).
// Reduced motion never starts the drop, so this never shows.
function SpawnBeam({ walk }: { walk: WalkState }) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const burstRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const parts = useMemo(() => {
    const base = new THREE.MeshBasicMaterial({
      color: 0x9fe8ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    return {
      beam: base,
      ring: base.clone(),
      ring2: base.clone(),
      burst: base.clone(),
    };
  }, []);
  useEffect(() => {
    return () => Object.values(parts).forEach((m) => m.dispose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const t = walk.spawnT;
    const on = t < 1.7;
    g.visible = on;
    if (!on) return;
    // land wherever the player actually spawns (portrait shifts spawn back)
    if (t < 0.2) g.position.set(walk.pos.x, 0, walk.pos.z);
    const pill =
      t < 0.12 ? t / 0.12 : t < 0.95 ? 1 : Math.max(0, 1 - (t - 0.95) / 0.6);
    parts.beam.opacity = 0.34 * pill;
    if (beamRef.current) {
      const r = 1 - 0.65 * Math.min(t / 1.5, 1);
      beamRef.current.scale.set(r, 1, r);
    }
    const r1 = Math.min(t / 0.9, 1);
    parts.ring.opacity = 0.75 * (1 - r1);
    ringRef.current?.scale.setScalar(0.5 + 2.6 * r1);
    const r2 = THREE.MathUtils.clamp((t - 0.3) / 0.9, 0, 1);
    parts.ring2.opacity = 0.55 * (1 - r2);
    ring2Ref.current?.scale.setScalar(0.4 + 2.2 * r2);
    const bt = THREE.MathUtils.clamp((t - 1.05) / 0.5, 0, 1);
    parts.burst.opacity = bt > 0 ? 0.85 * (1 - bt) : 0;
    burstRef.current?.scale.setScalar(0.4 + 3 * bt);
    if (lightRef.current) {
      lightRef.current.intensity =
        t < 1.05 ? 3.5 * pill : 9 * Math.max(0, 1 - (t - 1.05) / 0.45);
    }
  });
  return (
    <group
      ref={groupRef}
      position={[SPAWN_POS.x, 0, SPAWN_POS.z]}
      visible={false}
    >
      <mesh
        ref={beamRef}
        position={[0, ROOM_HEIGHT / 2 - 0.05, 0]}
        material={parts.beam}
      >
        <cylinderGeometry args={[0.7, 0.85, ROOM_HEIGHT - 0.1, 24, 1, true]} />
      </mesh>
      <mesh
        ref={ringRef}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={parts.ring}
      >
        <ringGeometry args={[0.42, 0.56, 40]} />
      </mesh>
      <mesh
        ref={ring2Ref}
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={parts.ring2}
      >
        <ringGeometry args={[0.42, 0.5, 40]} />
      </mesh>
      <mesh
        ref={burstRef}
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={parts.burst}
      >
        <ringGeometry args={[0.36, 0.62, 40]} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 1.6, 0]}
        color={0x9fd8ff}
        intensity={0}
        distance={7}
        decay={2}
      />
    </group>
  );
}

// ========================= SCREEN TEXTURES =========================

function renderScreenCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COL_SCREEN_BG;
  ctx.fillRect(0, 0, w, h);
  // subtle scanlines
  ctx.fillStyle = "rgba(255,255,255,0.016)";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  draw(ctx, w, h);
  // vignette so panel edges fall off like real displays
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function makeScreenTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w = 512,
  h = 320
): THREE.CanvasTexture {
  // painted at 2x for crisp text; painters keep working in logical w/h
  const canvas = document.createElement("canvas");
  canvas.width = w * 2;
  canvas.height = h * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  renderScreenCanvas(ctx, w, h, draw);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---- the quickstart: layout constants shared by painter + hit planes ----

const QS = {
  W: 1024,
  H: 476,
  pad: 30,
  gap: 16,
  top: 96,
  bottom: 28,
};
const QS_CARD_W = (QS.W - QS.pad * 2 - QS.gap * 4) / 5; // 176.8
const QS_CARD_H = QS.H - QS.top - QS.bottom;

const QS_TABS = [
  ["01", ["WHAT", "I DO"], "how I operate"],
  ["02", ["PROJECTS"], "what I build"],
  ["03", ["WORK", "EXPERIENCE"], "the timeline"],
  ["04", ["WHO IS", "THIS GUY?"], "the human"],
  ["05", ["GET IN", "TOUCH"], "open a channel"],
] as const;


/** map a plane UV hit to a quickstart tab index, -1 outside the cards */
function uvToTab(u: number, v: number): number {
  const px = u * QS.W;
  const py = (1 - v) * QS.H;
  if (py < QS.top || py > QS.top + QS_CARD_H) return -1;
  const rel = px - QS.pad;
  const cell = QS_CARD_W + QS.gap;
  const idx = Math.floor(rel / cell);
  if (rel < 0 || idx < 0 || idx > 4) return -1;
  if (rel - idx * cell > QS_CARD_W) return -1; // in the gap between cards
  return idx;
}

const QS_COLORS = ["#6ee7ff", "#ff8a5c", "#ffd166", "#c792ea", "#7ce38b"];

// high-fi vector glyphs: filled, gradient-lit, instantly readable
function glyphGradient(
  ctx: CanvasRenderingContext2D,
  cy: number,
  r: number,
  color: string
): CanvasGradient {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.35, color);
  g.addColorStop(1, color);
  return g;
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  tab: number,
  cx: number,
  cy: number,
  r: number,
  color: string
) {
  ctx.save();
  // backdrop disc + ring gives every icon the same premium framing
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.42, 0, Math.PI * 2);
  ctx.fillStyle = color + "14";
  ctx.fill();
  ctx.strokeStyle = color + "55";
  ctx.lineWidth = 2;
  ctx.stroke();

  const grad = glyphGradient(ctx, cy, r, color);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;

  if (tab === 0) {
    // skill mixer: three tracks, lit fills, glowing knobs
    const rows = [
      [-0.52, 0.62],
      [0, 0.86],
      [0.52, 0.4],
    ] as const;
    for (const [off, v] of rows) {
      const y = cy + off * r;
      // track
      ctx.beginPath();
      ctx.roundRect(cx - r, y - 5, 2 * r, 10, 5);
      ctx.fillStyle = color + "26";
      ctx.fill();
      // lit portion
      ctx.beginPath();
      ctx.roundRect(cx - r, y - 5, 2 * r * v, 10, 5);
      ctx.fillStyle = grad;
      ctx.fill();
      // knob
      const kx = cx - r + 2 * r * v;
      ctx.beginPath();
      ctx.arc(kx, y, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(kx, y, 9.5, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else if (tab === 1) {
    // rocket with window, fins and a live flame
    ctx.lineWidth = 5;
    // fins
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.34, cy + r * 0.18);
    ctx.lineTo(cx - r * 0.78, cy + r * 0.72);
    ctx.lineTo(cx - r * 0.3, cy + r * 0.62);
    ctx.closePath();
    ctx.moveTo(cx + r * 0.34, cy + r * 0.18);
    ctx.lineTo(cx + r * 0.78, cy + r * 0.72);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.62);
    ctx.closePath();
    ctx.fillStyle = color + "cc";
    ctx.fill();
    // body
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 1.05);
    ctx.quadraticCurveTo(cx + r * 0.46, cy - r * 0.45, cx + r * 0.34, cy + r * 0.55);
    ctx.lineTo(cx - r * 0.34, cy + r * 0.55);
    ctx.quadraticCurveTo(cx - r * 0.46, cy - r * 0.45, cx, cy - r * 1.05);
    ctx.fillStyle = grad;
    ctx.fill();
    // window
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.28, r * 0.17, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0e16";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // flame: warm core inside colored plume
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.2, cy + r * 0.58);
    ctx.quadraticCurveTo(cx, cy + r * 1.35, cx + r * 0.2, cy + r * 0.58);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.09, cy + r * 0.58);
    ctx.quadraticCurveTo(cx, cy + r * 1.02, cx + r * 0.09, cy + r * 0.58);
    ctx.closePath();
    ctx.fillStyle = "#fff6e0";
    ctx.fill();
  } else if (tab === 2) {
    // briefcase: the timeline of jobs, instantly readable
    ctx.lineWidth = 4;
    // handle
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.3, cy - r * 0.95, r * 0.6, r * 0.42, 8);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.stroke();
    // case body
    ctx.beginPath();
    ctx.roundRect(cx - r, cy - r * 0.6, 2 * r, r * 1.45, 12);
    ctx.fillStyle = grad;
    ctx.fill();
    // lid seam + latch
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r * 0.05);
    ctx.lineTo(cx + r, cy - r * 0.05);
    ctx.strokeStyle = "#0b0e16";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.16, cy - r * 0.22, r * 0.32, r * 0.34, 4);
    ctx.fillStyle = "#0b0e16";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (tab === 3) {
    // portrait bust in a frame ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.stroke();
    // head
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.3, r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    // shoulders (clipped by the ring)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.75, cy + r * 1.05);
    ctx.quadraticCurveTo(cx, cy + r * 0.02, cx + r * 0.75, cy + r * 1.05);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  } else {
    // paper plane with a dashed flight trail
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.15, cy + r * 0.75);
    ctx.quadraticCurveTo(cx - r * 0.4, cy + r * 0.95, cx - r * 0.05, cy + r * 0.35);
    ctx.strokeStyle = color + "88";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);
    // upper wing
    ctx.beginPath();
    ctx.moveTo(cx + r * 1.05, cy - r * 0.75);
    ctx.lineTo(cx - r * 0.85, cy + r * 0.05);
    ctx.lineTo(cx + r * 0.05, cy + r * 0.22);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // lower wing (darker fold)
    ctx.beginPath();
    ctx.moveTo(cx + r * 1.05, cy - r * 0.75);
    ctx.lineTo(cx + r * 0.05, cy + r * 0.22);
    ctx.lineTo(cx + r * 0.12, cy + r * 0.75);
    ctx.closePath();
    ctx.fillStyle = color + "99";
    ctx.fill();
    // fold line highlight
    ctx.beginPath();
    ctx.moveTo(cx + r * 1.05, cy - r * 0.75);
    ctx.lineTo(cx + r * 0.05, cy + r * 0.22);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

function paintQuickstart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hot: number
) {
  // header
  ctx.font = "600 34px ui-monospace, Menlo, monospace";
  ctx.fillStyle = COL_SCREEN_GLOW;
  ctx.fillText("EXECUTIVE FUNCTION", QS.pad, 46);
  ctx.font = "500 19px ui-monospace, Menlo, monospace";
  ctx.fillStyle = COL_SCREEN_DIM;
  ctx.fillText("QUICKSTART · five files that explain me · open one", QS.pad, 75);
  const grad = ctx.createLinearGradient(QS.pad, 0, w - QS.pad, 0);
  grad.addColorStop(0, "rgba(178,196,232,0.6)");
  grad.addColorStop(1, "rgba(178,196,232,0.05)");
  ctx.fillStyle = grad;
  ctx.fillRect(QS.pad, 84, w - QS.pad * 2, 2);
  ctx.font = "500 15px ui-monospace, Menlo, monospace";
  ctx.fillStyle = COL_SCREEN_DIM;
  ctx.fillText("● SYSTEM READY", w - 185, 46);

  const GLYPH_H = 150;
  for (let i = 0; i < 5; i++) {
    const [num, labelLines, sub] = QS_TABS[i];
    const color = QS_COLORS[i];
    const x = QS.pad + i * (QS_CARD_W + QS.gap);
    const y = QS.top;
    const isHot = hot === i;

    ctx.beginPath();
    ctx.roundRect(x, y, QS_CARD_W, QS_CARD_H, 12);
    ctx.fillStyle = isHot ? "rgba(178,196,232,0.12)" : "rgba(178,196,232,0.045)";
    ctx.fill();

    // glyph header
    drawGlyph(ctx, i, x + QS_CARD_W / 2, y + GLYPH_H / 2 + 14, 45, color);

    // number chip
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 12, 50, 31, 7);
    ctx.fillStyle = "rgba(8,10,16,0.8)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.globalAlpha = isHot ? 1 : 0.55;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = "600 18px ui-monospace, Menlo, monospace";
    ctx.fillStyle = isHot ? "#ffffff" : color;
    ctx.fillText(num, x + 24, y + 34);

    // label
    ctx.font = "700 26px ui-monospace, Menlo, monospace";
    ctx.fillStyle = isHot ? "#ffffff" : "rgba(230,238,255,0.92)";
    labelLines.forEach((line, li) => {
      ctx.fillText(line, x + 16, y + GLYPH_H + 48 + li * 33);
    });

    // sub + affordance
    ctx.font = "500 20px ui-monospace, Menlo, monospace";
    ctx.fillStyle = "rgba(196,210,238,0.85)";
    ctx.fillText(sub, x + 16, y + QS_CARD_H - 46);
    ctx.font = "600 17px ui-monospace, Menlo, monospace";
    ctx.fillStyle = isHot ? color : "rgba(178,196,232,0.55)";
    ctx.fillText(isHot ? "OPEN ▸" : "▸", x + 16, y + QS_CARD_H - 18);

    // border
    ctx.beginPath();
    ctx.roundRect(x, y, QS_CARD_W, QS_CARD_H, 12);
    if (isHot) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
    } else {
      ctx.strokeStyle = "rgba(178,196,232,0.34)";
      ctx.lineWidth = 1.5;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}




const MONO = "500 22px ui-monospace, Menlo, monospace";
const MONO_SM = "500 17px ui-monospace, Menlo, monospace";
const MONO_XS = "500 13px ui-monospace, Menlo, monospace";

function headerBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  title: string,
  num: string
) {
  ctx.fillStyle = "rgba(178,196,232,0.12)";
  ctx.fillRect(0, 0, w, 40);
  ctx.font = MONO_SM;
  ctx.fillStyle = COL_SCREEN_GLOW;
  ctx.fillText(`${num}  ${title.toUpperCase()}`, 16, 26);
  ctx.fillStyle = COL_SCREEN_DIM;
  ctx.fillText("● LIVE", w - 78, 26);
}

// Per-station screen content — real site facts, drawn once
const SCREEN_PAINTERS: Record<
  string,
  (ctx: CanvasRenderingContext2D, w: number, h: number) => void
> = {
  playground: (ctx, w, h) => {
    headerBar(ctx, w, "agent fleet · telemetry", "02");
    const cells = [
      ["AGENT FLEET", "RUNNING", "#7ce38b", 0.92],
      ["PROPERTY AI", "RUNNING", "#7ce38b", 0.78],
      ["HEALTH OS", "RUNNING", "#7ce38b", 0.85],
      ["ICEKORE AGENTS", "PROD", "#6ee7ff", 0.7],
      ["THIS WEBSITE", "SELF-HOST", "#6ee7ff", 0.6],
      ["NEXT EXPERIMENT", "QUEUED", "#ffd166", 0.3],
    ] as const;
    const cw = (w - 48) / 2;
    const chh = (h - 118) / 3;
    cells.forEach(([name, status, dotColor, level], i) => {
      const x = 16 + (i % 2) * (cw + 16);
      const y = 56 + Math.floor(i / 2) * (chh + 8);
      ctx.strokeStyle = "rgba(178,196,232,0.25)";
      ctx.strokeRect(x, y, cw, chh);
      // status dot + name
      ctx.beginPath();
      ctx.arc(x + 16, y + 20, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = String(dotColor);
      ctx.shadowColor = String(dotColor);
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = MONO_SM;
      ctx.fillStyle = COL_SCREEN_GLOW;
      ctx.fillText(String(name), x + 30, y + 25);
      ctx.font = MONO_XS;
      ctx.fillStyle = COL_SCREEN_DIM;
      ctx.fillText(`▸ ${status}`, x + 30, y + 44);
      ctx.fillText(`${(97 + Number(level) * 2.9).toFixed(2)}% uptime`, x + cw - 128, y + 25);
      // sparkline (deterministic per cell)
      ctx.beginPath();
      const sx = x + 14;
      const sw2 = cw - 28;
      const sy = y + chh - 14;
      for (let k = 0; k <= 22; k++) {
        const t = k / 22;
        const n =
          Math.sin(i * 3.7 + k * 1.4) * 0.4 +
          Math.sin(i * 1.3 + k * 0.55) * 0.6;
        const yy = sy - (0.5 + 0.5 * n) * 16 * Number(level) - 2;
        if (k === 0) ctx.moveTo(sx, yy);
        else ctx.lineTo(sx + t * sw2, yy);
      }
      ctx.strokeStyle = String(dotColor) + "aa";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    // live ticker footer
    ctx.fillStyle = "rgba(178,196,232,0.1)";
    ctx.fillRect(0, h - 30, w, 30);
    ctx.font = MONO_XS;
    ctx.fillStyle = COL_SCREEN_GLOW;
    ctx.fillText(
      "TASKS TODAY 47 · TOKENS 2.1M · AGENTS 5 ACTIVE · LAST DEPLOY 14m · MOOD: SHIPPING",
      16,
      h - 10
    );
  },
  work: (ctx, w, h) => {
    headerBar(ctx, w, "career tape", "03");
    const stops = [
      ["2026", "AI-NATIVE BUILDER"],
      ["2024", "ICEKORE — CO-FOUNDER"],
      ["2021", "HEROIC PBC — GROWTH"],
      ["2019", "PERFORMANCE MARKETING"],
      ["....", "REWIND FOR MORE"],
    ] as const;
    ctx.strokeStyle = "rgba(178,196,232,0.35)";
    ctx.beginPath();
    ctx.moveTo(44, 60);
    ctx.lineTo(44, h - 20);
    ctx.stroke();
    stops.forEach(([year, label], i) => {
      const y = 76 + i * 48;
      ctx.fillStyle = COL_SCREEN_GLOW;
      ctx.beginPath();
      ctx.arc(44, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = MONO_SM;
      ctx.fillText(String(year), 62, y);
      ctx.fillStyle = COL_SCREEN_DIM;
      ctx.font = MONO_XS;
      ctx.fillText(String(label), 128, y);
    });
  },
  "who-i-am": (ctx, w, h) => {
    headerBar(ctx, w, "the operator", "04");
    ctx.font = MONO;
    ctx.fillStyle = COL_SCREEN_GLOW;
    ctx.fillText("ALEXANDER WOLF PEDERSEN", 16, 84);
    const facts = [
      "RUNS · LIFTS · EATS ICE CREAM",
      "IF IT MOVES, I'M IN",
      "BUILDS THINGS THAT WORK ALONE",
      "COPENHAGEN → THE WORLD",
    ];
    ctx.font = MONO_XS;
    facts.forEach((f, i) => {
      ctx.fillStyle = COL_SCREEN_DIM;
      ctx.fillText(f, 16, 122 + i * 30);
    });
    ctx.strokeStyle = "rgba(178,196,232,0.3)";
    ctx.strokeRect(w - 116, 62, 96, h - 100);
    ctx.font = MONO_XS;
    ctx.fillStyle = COL_SCREEN_DIM;
    ctx.fillText("PHOTO", w - 96, h / 2 + 10);
  },
  connect: (ctx, w, h) => {
    headerBar(ctx, w, "transmitter", "05");
    ctx.font = MONO;
    ctx.fillStyle = COL_SCREEN_GLOW;
    ctx.fillText("OPEN CHANNELS", 16, 86);
    const chans = ["EMAIL", "LINKEDIN", "GITHUB"];
    ctx.font = MONO_SM;
    chans.forEach((c, i) => {
      ctx.fillStyle = COL_SCREEN_DIM;
      ctx.fillText(`FREQ ${i + 1} ──`, 16, 126 + i * 34);
      ctx.fillStyle = COL_SCREEN_GLOW;
      ctx.fillText(c, 140, 126 + i * 34);
    });
    ctx.strokeStyle = "rgba(178,196,232,0.5)";
    ctx.beginPath();
    ctx.arc(w - 90, h - 78, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w - 90, h - 78);
    ctx.lineTo(w - 60, h - 104);
    ctx.stroke();
    ctx.font = MONO_XS;
    ctx.fillStyle = COL_SCREEN_DIM;
    ctx.fillText("TRANSMIT", w - 124, h - 20);
  },
};

// ========================= FURNITURE BUILDERS =========================

interface StationVisual {
  boxes: { pos: THREE.Vector3; size: [number, number, number] }[];
  screen: {
    pos: THREE.Vector3;
    size: [number, number];
    rotX: number;
  };
}

// screens face the room per the station's yaw; positions are pre-rotated
// offsets from the station center
function stationVisual(st: RoomStation): StationVisual {
  const [sx, sy, sz] = st.size;
  const rot = (v: THREE.Vector3) =>
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), st.yaw).add(st.position);
  switch (st.contentKey) {
    case "craft":
      // console desk + THE quickstart display: large, mounted, unmissable
      return {
        boxes: [
          { pos: st.position.clone(), size: [sx, sy, sz] },
          // display mount columns
          { pos: rot(new THREE.Vector3(-1.25, sy + 0.36, -0.34)), size: [0.12, 0.9, 0.08] },
          { pos: rot(new THREE.Vector3(1.25, sy + 0.36, -0.34)), size: [0.12, 0.9, 0.08] },
        ],
        screen: {
          pos: rot(new THREE.Vector3(0, sy + 1.0, -0.3)),
          size: [4.15, 1.92],
          rotX: -0.14,
        },
      };
    case "playground":
      // monitor wall: thin slab + big screen on its face
      return {
        boxes: [{ pos: st.position.clone(), size: [sx, sy, 0.3] }],
        screen: {
          pos: rot(new THREE.Vector3(0, 0.1, 0.2)),
          size: [sx * 0.92, sy * 0.82],
          rotX: 0,
        },
      };
    case "work":
      // plotter cabinet + tall screen face
      return {
        boxes: [{ pos: st.position.clone(), size: [sz, sy, sx] }],
        screen: {
          pos: rot(new THREE.Vector3(0, 0.15, 0.31)),
          size: [2.0, 1.5],
          rotX: 0,
        },
      };
    case "who-i-am":
      // low desk + small tilted screen
      return {
        boxes: [{ pos: st.position.clone(), size: [sx, sy, sz] }],
        screen: {
          pos: rot(new THREE.Vector3(0, sy * 0.5 + 0.42, 0)),
          size: [1.5, 0.85],
          rotX: -0.18,
        },
      };
    default:
      // connect: transmitter tower + screen
      return {
        boxes: [{ pos: st.position.clone(), size: [sx, sy, sz] }],
        screen: {
          pos: rot(new THREE.Vector3(0, 0.45, sz * 0.55)),
          size: [1.35, 0.95],
          rotX: -0.08,
        },
      };
  }
}

// ========================= RENDER ENVIRONMENT =========================

// PMREM room environment gives every PBR surface believable reflections
// without any external assets; fog grounds the far corners.
function RenderEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const env = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.25;
    scene.fog = new THREE.Fog(0x05070d, 6, 28);
    // static scene: bake the shadow maps once, then stop re-rendering them
    gl.shadowMap.autoUpdate = false;
    return () => {
      scene.environment = null;
      scene.fog = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

// ========================= SCENE =========================

let debugDt: number | null = null;

const tmpVec = new THREE.Vector3();
const euler = new THREE.Euler(0, 0, 0, "YXZ");

interface RoomSceneInnerProps {
  entered: boolean;
  reducedMotion: boolean;
  walk: WalkState;
  regionScreenRef: React.RefObject<RegionScreen[]>;
  apiRef: React.MutableRefObject<RoomApi | null>;
  onSettled: () => void;
  onFocus: (station: number) => void;
  onDefocus: () => void;
  onOpenSection: (section: number) => void;
}

function RoomSceneInner({
  entered,
  reducedMotion,
  walk,
  regionScreenRef,
  apiRef,
  onSettled,
  onFocus,
  onDefocus,
  onOpenSection,
}: RoomSceneInnerProps) {
  const { camera, size, gl } = useThree();

  const onSettledRef = useRef(onSettled);
  const onFocusRef = useRef(onFocus);
  const onDefocusRef = useRef(onDefocus);
  onSettledRef.current = onSettled;
  onFocusRef.current = onFocus;
  onDefocusRef.current = onDefocus;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const enteredRef = useRef(entered);
  enteredRef.current = entered;

  const worldTime = useRef(0);
  const enteredTime = useRef<number | null>(null);
  const settledFired = useRef(false);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const heroLightRef = useRef<THREE.SpotLight>(null);

  // aim the shadow lights (targets are not in the scene graph, so update
  // their matrices manually once)
  useEffect(() => {
    const key = keyLightRef.current;
    if (key) {
      key.target.position.set(0, 0.6, 1.0);
      key.target.updateMatrixWorld();
    }
    const hero = heroLightRef.current;
    if (hero) {
      hero.target.position.set(0, 1.05, -3.3);
      hero.target.updateMatrixWorld();
    }
  }, []);

  // ---- room surfaces: PBR + procedural maps ----
  const surfaceMats = useMemo(() => {
    const floorMaps = makeFloorMaps();
    const wallMaps = makeWallMaps(7.8);
    const brushed = makeBrushedRoughness();
    return {
      // dark industrial resin floor: seams + traffic wear + baked contact AO
      floor: new THREE.MeshStandardMaterial({
        color: 0x14161d,
        roughness: 0.4,
        metalness: 0.82,
        envMapIntensity: 1.1,
        map: floorMaps.map,
        roughnessMap: floorMaps.rough,
        bumpMap: floorMaps.rough,
        bumpScale: 0.015,
        aoMap: floorMaps.ao,
        aoMapIntensity: 0.9,
      }),
      wall: new THREE.MeshStandardMaterial({
        color: 0x171a24,
        roughness: 0.58,
        metalness: 0.35,
        envMapIntensity: 0.35,
        map: wallMaps.map,
        roughnessMap: wallMaps.rough,
        bumpMap: wallMaps.rough,
        bumpScale: 0.01,
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: 0x0f1117,
        roughness: 0.85,
        metalness: 0.2,
        envMapIntensity: 0.15,
      }),
      // brushed dark metal furniture
      furniture: new THREE.MeshStandardMaterial({
        color: 0x1a1e29,
        roughness: 0.36,
        metalness: 0.9,
        envMapIntensity: 0.85,
        roughnessMap: brushed,
      }),
      bezel: new THREE.MeshStandardMaterial({
        color: 0x0c0e14,
        roughness: 0.28,
        metalness: 0.6,
        envMapIntensity: 1.0,
      }),
    };
  }, []);

  // rounded furniture geometry (soft bevels read as manufactured objects)
  const roundedGeos = useMemo(() => {
    const map = new Map<string, RoundedBoxGeometry>();
    for (const st of STATIONS) {
      const vis = stationVisual(st);
      vis.boxes.forEach((box, j) => {
        map.set(
          `${st.id}-${j}`,
          new RoundedBoxGeometry(box.size[0], box.size[1], box.size[2], 3, 0.035)
        );
      });
    }
    return map;
  }, []);

  // front wall has the window cutout: four planes around the opening
  const frontWallPieces = useMemo(() => {
    const z = -ROOM_HALF_Z;
    const pieces: { pos: [number, number, number]; size: [number, number] }[] = [
      // left of window
      {
        pos: [(-ROOM_HALF_X + WINDOW.x0) / 2, ROOM_HEIGHT / 2, z],
        size: [WINDOW.x0 + ROOM_HALF_X, ROOM_HEIGHT],
      },
      // right of window
      {
        pos: [(ROOM_HALF_X + WINDOW.x1) / 2, ROOM_HEIGHT / 2, z],
        size: [ROOM_HALF_X - WINDOW.x1, ROOM_HEIGHT],
      },
      // below window
      {
        pos: [(WINDOW.x0 + WINDOW.x1) / 2, WINDOW.y0 / 2, z],
        size: [WINDOW.x1 - WINDOW.x0, WINDOW.y0],
      },
      // above window
      {
        pos: [
          (WINDOW.x0 + WINDOW.x1) / 2,
          (ROOM_HEIGHT + WINDOW.y1) / 2,
          z,
        ],
        size: [WINDOW.x1 - WINDOW.x0, ROOM_HEIGHT - WINDOW.y1],
      },
    ];
    return pieces;
  }, []);

  // glow edges: room frame + window frame + furniture outlines + floor grid
  const edgeGeo = useMemo(() => {
    const pts: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) =>
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // room box edges (floor + ceiling rectangles + verticals)
    const X = ROOM_HALF_X;
    const Z = ROOM_HALF_Z;
    const H = ROOM_HEIGHT;
    for (const y of [0, H]) {
      push(v(-X, y, -Z), v(X, y, -Z));
      push(v(X, y, -Z), v(X, y, Z));
      push(v(X, y, Z), v(-X, y, Z));
      push(v(-X, y, Z), v(-X, y, -Z));
    }
    for (const [x, z] of [
      [-X, -Z],
      [X, -Z],
      [X, Z],
      [-X, Z],
    ]) {
      push(v(x, 0, z), v(x, H, z));
    }
    // window frame
    push(v(WINDOW.x0, WINDOW.y0, -Z), v(WINDOW.x1, WINDOW.y0, -Z));
    push(v(WINDOW.x1, WINDOW.y0, -Z), v(WINDOW.x1, WINDOW.y1, -Z));
    push(v(WINDOW.x1, WINDOW.y1, -Z), v(WINDOW.x0, WINDOW.y1, -Z));
    push(v(WINDOW.x0, WINDOW.y1, -Z), v(WINDOW.x0, WINDOW.y0, -Z));
    // floor grid
    for (let x = -X + 1; x < X; x += 1) {
      push(v(x, 0.001, -Z), v(x, 0.001, Z));
    }
    for (let z = -Z + 1; z < Z; z += 1) {
      push(v(-X, 0.001, z), v(X, 0.001, z));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, []);

  const furnitureEdgeGeo = useMemo(() => {
    const pts: number[] = [];
    for (const st of STATIONS) {
      const vis = stationVisual(st);
      for (const box of vis.boxes) {
        const g = new THREE.BoxGeometry(box.size[0], box.size[1], box.size[2]);
        const eg = new THREE.EdgesGeometry(g, 12);
        const arr = eg.getAttribute("position").array as Float32Array;
        const m = new THREE.Matrix4()
          .makeRotationY(st.yaw)
          .setPosition(box.pos.x, box.pos.y, box.pos.z);
        for (let i = 0; i < arr.length; i += 3) {
          tmpVec.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(m);
          pts.push(tmpVec.x, tmpVec.y, tmpVec.z);
        }
        g.dispose();
        eg.dispose();
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, []);

  // with real lighting the edge lines become accents, not the whole look
  const roomEdgeMat = useMemo(() => edgeMaterial(0.4, 0.005), []);
  const gridEdgeMat = useMemo(() => edgeMaterial(0.14, 0.01), []);
  const furnitureEdgeMat = useMemo(() => edgeMaterial(0.55, 0.003), []);

  // grid separated from frame for independent alpha
  const { frameGeo, gridGeo } = useMemo(() => {
    // recompute split: frame = first (8 + 4 + 4) segments, grid = rest
    const arr = edgeGeo.getAttribute("position").array as Float32Array;
    const frameCount = (8 + 4 + 4) * 2 * 3;
    const frame = new THREE.BufferGeometry();
    frame.setAttribute("position", new THREE.BufferAttribute(arr.slice(0, frameCount), 3));
    const grid = new THREE.BufferGeometry();
    grid.setAttribute("position", new THREE.BufferAttribute(arr.slice(frameCount), 3));
    return { frameGeo: frame, gridGeo: grid };
  }, [edgeGeo]);

  // ---- screens ----
  const screens = useMemo(
    () =>
      STATIONS.map((st) => {
        const vis = stationVisual(st);
        if (st.contentKey === "craft") {
          // THE quickstart: repaintable for tab hover states
          // 2x canvas, painted in logical QS units: readable from spawn
          const canvas = document.createElement("canvas");
          canvas.width = QS.W * 2;
          canvas.height = QS.H * 2;
          const ctx = canvas.getContext("2d")!;
          ctx.setTransform(2, 0, 0, 2, 0, 0);
          renderScreenCanvas(ctx, QS.W, QS.H, (c, w, h) => paintQuickstart(c, w, h, -1));
          const tex = new THREE.CanvasTexture(canvas);
          tex.anisotropy = 16;
          tex.colorSpace = THREE.SRGBColorSpace;
          const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
          const repaint = (hot: number) => {
            ctx.setTransform(2, 0, 0, 2, 0, 0);
            renderScreenCanvas(ctx, QS.W, QS.H, (c, w, h) => paintQuickstart(c, w, h, hot));
            tex.needsUpdate = true;
          };
          return { st, vis, tex, mat, ch: QS.H, repaint: repaint as ((hot: number) => void) | undefined };
        }
        // canvas aspect matches the plane so text is never squished
        const [pw, ph] = vis.screen.size;
        const cw = 640;
        const ch = Math.round(THREE.MathUtils.clamp((cw * ph) / pw, 160, 720));
        const tex = makeScreenTexture(
          SCREEN_PAINTERS[st.contentKey] ?? (() => {}),
          cw,
          ch
        );
        if (st.contentKey === "who-i-am") {
          // fill the PHOTO slot with the real portrait once it loads
          const im = new Image();
          im.onload = () => {
            const canvas = tex.image as HTMLCanvasElement;
            // the context is scaled 2x; keep working in logical units
            const c2 = canvas.getContext("2d")!;
            const lw = canvas.width / 2;
            const lh = canvas.height / 2;
            const bx = lw - 116;
            const by = 62;
            const bw = 96;
            const bh = lh - 100;
            const scale = Math.max(bw / im.naturalWidth, bh / im.naturalHeight);
            c2.save();
            c2.beginPath();
            c2.rect(bx, by, bw, bh);
            c2.clip();
            c2.drawImage(
              im,
              bx + (bw - im.naturalWidth * scale) / 2,
              by + (bh - im.naturalHeight * scale) / 2,
              im.naturalWidth * scale,
              im.naturalHeight * scale
            );
            c2.restore();
            tex.needsUpdate = true;
          };
          im.src = "/content/profile-photo.jpg";
        }
        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: false,
          toneMapped: false, // crisp UI, no ACES desaturation
        });
        return { st, vis, tex, mat, ch, repaint: undefined as ((hot: number) => void) | undefined };
      }),
    []
  );
  const hotTabRef = useRef(-1);


  // ---- the neural storm outside the window ----
  const world = useMemo(() => generateInteriorWorld(42), []);
  const stormGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(world.ambient.positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(world.ambient.seeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(world.ambient.sizes, 1));
    geo.setAttribute(
      "aBrightness",
      new THREE.BufferAttribute(world.ambient.brightness, 1)
    );
    return geo;
  }, [world]);
  const stormShellGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(world.shell.positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(world.shell.seeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(world.shell.sizes, 1));
    geo.setAttribute(
      "aBrightness",
      new THREE.BufferAttribute(world.shell.brightness, 1)
    );
    return geo;
  }, [world]);
  const stormMat = useMemo(() => pointsMaterial(0.00028, 820), []);
  const stormShellMat = useMemo(() => pointsMaterial(0.0002, 820), []);
  const stormTractGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(world.tracts.segmentPositions, 3)
    );
    return geo;
  }, [world]);
  const stormTractMat = useMemo(() => edgeMaterial(0.3, 0.0005), []);

  // ---- room dust ----
  const dustGeo = useMemo(() => {
    const N = 260;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const sz = new Float32Array(N);
    const br = new Float32Array(N);
    let s = 987654321;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rand() * 2 - 1) * (ROOM_HALF_X - 0.4);
      pos[i * 3 + 1] = 0.2 + rand() * (ROOM_HEIGHT - 0.5);
      pos[i * 3 + 2] = (rand() * 2 - 1) * (ROOM_HALF_Z - 0.4);
      seed[i] = rand() * Math.PI * 2;
      sz[i] = 0.25 + rand() * 0.3;
      br[i] = 0.05 + rand() * 0.07;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(br, 1));
    return geo;
  }, []);
  const dustMat = useMemo(() => pointsMaterial(0.02, 320), []);

  // dispose
  useEffect(() => {
    return () => {
      [roomEdgeMat, gridEdgeMat, furnitureEdgeMat, stormMat, stormShellMat, stormTractMat, dustMat].forEach(
        (m) => m.dispose()
      );
      [edgeGeo, furnitureEdgeGeo, frameGeo, gridGeo, stormGeo, stormShellGeo, stormTractGeo, dustGeo].forEach(
        (g) => g.dispose()
      );
      Object.values(surfaceMats).forEach((m) => {
        m.map?.dispose();
        m.roughnessMap?.dispose();
        m.aoMap?.dispose();
        m.dispose();
      });
      roundedGeos.forEach((g) => g.dispose());
      screens.forEach((s) => {
        s.tex.dispose();
        s.mat.dispose();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- camera fov by aspect ----
  const baseFovRef = useRef(68);
  const fovKickRef = useRef(0);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = size.width < size.height ? 78 : 68;
    baseFovRef.current = cam.fov;
    cam.aspect = size.width / size.height;
    cam.near = 0.08;
    cam.far = 220;
    cam.updateProjectionMatrix();
  }, [camera, size]);

  // ---- api ----
  useEffect(() => {
    apiRef.current = {
      reset() {
        settledFired.current = false;
        enteredTime.current = null;
      },
    };
    return () => {
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- dev stepper ----
  const { scene } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as Record<string, unknown>).__castCheck = (
      cssX: number,
      cssY: number
    ) => {
      const cam = camera as THREE.PerspectiveCamera;
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2((cssX / window.innerWidth) * 2 - 1, -(cssY / window.innerHeight) * 2 + 1),
        cam
      );
      const hits = ray.intersectObjects(scene.children, true);
      return {
        planeFound: !!scene.getObjectByName("qs-hitplane"),
        meshes: hits
          .filter((h) => h.object.type === "Mesh")
          .slice(0, 6)
          .map((hit) => `${hit.object.name || hit.object.type}@${hit.distance.toFixed(2)}`),
      };
    };
    window.__brainStep = (frames = 60) => {
      debugDt = 1 / 60;
      const base = performance.now();
      for (let i = 0; i < frames; i++) advance(base + i * (1000 / 60));
      debugDt = null;
    };
    return () => {
      delete window.__brainStep;
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(debugDt ?? delta, 0.05);
    const motion = reducedRef.current ? 0.06 : 1;
    worldTime.current += dt * motion;
    const wt = worldTime.current;
    const cam = camera as THREE.PerspectiveCamera;

    // static scene: re-bake shadow maps only during the first moments
    // (covers late-mounting props), then they cost nothing per frame
    if (worldTime.current < 2) gl.shadowMap.needsUpdate = true;

    // entrance: brief fade handled in DOM; settle fires shortly after
    if (enteredRef.current && enteredTime.current === null) {
      enteredTime.current = 0;
    }
    if (enteredTime.current !== null) {
      enteredTime.current += dt;
      if (!settledFired.current && enteredTime.current > (reducedRef.current ? 0.1 : 1.1)) {
        settledFired.current = true;
        onSettledRef.current();
      }
    }

    // walk
    const event = stepWalk(walk, dt);
    if (event) {
      if (event.type === "focus") onFocusRef.current(event.station);
      else onDefocusRef.current();
    }

    // first-person camera at eye height, set slightly forward of the
    // body (like a head) so looking down reveals your own chest and legs.
    // Footstep bob + lateral sway sell "walking" over "gliding"; both
    // vanish under reduced motion.
    const sinY = Math.sin(walk.yaw);
    const cosY = Math.cos(walk.yaw);
    const gait = reducedRef.current ? 0 : walk.speed01;
    const bobY = Math.sin(walk.walkPhase * 2) * 0.04 * gait;
    const swayX = Math.sin(walk.walkPhase) * 0.02 * gait;
    // game-spawn drop-in: fall to eye height, land with a small dip
    let dropY = 0;
    const st = walk.spawnT;
    if (!reducedRef.current && st < 1.6) {
      const dp = 1 - Math.min(st / 1.05, 1);
      dropY = dp * dp * dp * 2.6;
      if (st > 1.05 && st < 1.42) {
        dropY -= 0.055 * Math.sin(((st - 1.05) / 0.37) * Math.PI);
      }
    }
    cam.position.set(
      walk.pos.x - sinY * 0.05 + cosY * swayX,
      EYE + bobY + dropY,
      walk.pos.z - cosY * 0.05 - sinY * swayX
    );
    euler.set(walk.pitch, walk.yaw, 0);
    cam.quaternion.setFromEuler(euler);
    // faint speed-fov kick so moving reads as motion, not zoom
    fovKickRef.current +=
      (gait * 2.2 - fovKickRef.current) * (1 - Math.exp(-6 * dt));
    const wantFov = baseFovRef.current + fovKickRef.current;
    if (Math.abs(cam.fov - wantFov) > 0.02) {
      cam.fov = wantFov;
      cam.updateProjectionMatrix();
    }

    // label projection
    cam.updateMatrixWorld();
    const screensOut = regionScreenRef.current;
    if (screensOut) {
      for (let i = 0; i < STATIONS.length; i++) {
        const anchor = STATIONS[i].labelAnchor;
        const out = screensOut[i];
        out.dist = cam.position.distanceTo(anchor);
        tmpVec.copy(anchor).applyMatrix4(cam.matrixWorldInverse);
        const inFront = tmpVec.z < 0;
        tmpVec.copy(anchor).project(cam);
        out.visible = inFront && Math.abs(tmpVec.x) < 1.15 && Math.abs(tmpVec.y) < 1.15;
        out.x = (tmpVec.x + 1) * 50;
        out.y = (-tmpVec.y + 1) * 50;
      }
    }

    // uniforms: storm flickers like distant lightning
    const flicker =
      0.85 +
      0.25 * Math.sin(wt * 0.5) +
      (Math.sin(wt * 7.3) > 0.94 ? 0.9 : 0) * motion;
    for (const m of [stormMat, stormShellMat]) {
      m.uniforms.uTime.value = wt;
      m.uniforms.uMotion.value = motion;
      m.uniforms.uSwell.value = flicker;
    }
    dustMat.uniforms.uTime.value = wt;
    dustMat.uniforms.uMotion.value = motion;
    dustMat.uniforms.uSwell.value = 0.5;
  });

  const clickGuard = (e: { delta: number }) => e.delta < 8;

  return (
    <>
      <RenderEnvironment />

      {/* ---- light rig (recipe order: base → key → hero → screens → warm) ---- */}
      <hemisphereLight args={[0x2a3548, 0x0b0e14, 0.4]} />
      {/* KEY: the neural-storm spill raking through the window — throws
          the mullion shadows across the console and floor */}
      <directionalLight
        ref={keyLightRef}
        color={0x9fb6e8}
        intensity={1.6}
        position={[0, 5.2, -10]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={22}
        shadow-camera-left={-4.2}
        shadow-camera-right={4.2}
        shadow-camera-top={3.6}
        shadow-camera-bottom={-1.2}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={5}
      />
      {/* hero pool over the central console */}
      <spotLight
        ref={heroLightRef}
        color={0xdfe8ff}
        intensity={26}
        position={[0, 3.5, -2.9]}
        angle={0.62}
        penumbra={0.9}
        distance={8}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
      />
      {/* screen washes (small screens shed the two accent lights) */}
      <pointLight color={0xa8c0ee} intensity={11} distance={4.5} decay={2} position={[-4.7, 1.75, -3.6]} />
      <pointLight color={0xb2c4e8} intensity={7} distance={3.5} decay={2} position={[0, 1.5, -2.55]} />
      {size.width > 820 && (
        <>
          <pointLight color={0xc4d2ec} intensity={6} distance={3.5} decay={2} position={[5.6, 1.7, -1.4]} />
          <pointLight color={0xb2c4e8} intensity={8} distance={4} decay={2} position={[3.3, 1.6, 3.7]} />
          {/* zone hues: the brain is not monochrome */}
          <pointLight color={0x9d7bff} intensity={4.5} distance={3.6} decay={2} position={[-5.6, 2.2, 3.2]} />
          <pointLight color={0x4ade80} intensity={3.5} distance={3.6} decay={2} position={[-6.0, 2.0, -1.6]} />
          <pointLight color={0x67e8f9} intensity={4.5} distance={4.2} decay={2} position={[-4.7, 1.7, -3.6]} />
          <pointLight color={0xffb36b} intensity={3.5} distance={3.6} decay={2} position={[-1.9, 2.0, 4.1]} />
          <pointLight color={0x7fd0ff} intensity={3.5} distance={3.4} decay={2} position={[4.9, 1.4, -2.4]} />
        </>
      )}
      {/* the one warm note in the room: the desk lamp in the human corner */}
      <pointLight color={0xe8ddc8} intensity={4.5} distance={3} decay={2} position={[-5.5, 1.15, 3.1]} />

      {/* floor + ceiling */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={surfaceMats.floor}
        receiveShadow
        onPointerMove={() => {
          if (process.env.NODE_ENV !== "production") {
            (window as unknown as Record<string, number>).__floorMove =
              ((window as unknown as Record<string, number>).__floorMove ?? 0) + 1;
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (walk.mode !== "free") return;
          walk.walkTarget = new THREE.Vector3(
            THREE.MathUtils.clamp(e.point.x, -6.5, 6.5),
            0,
            THREE.MathUtils.clamp(e.point.z, -4.5, 4.5)
          );
          walk.hasMoved = true;
        }}
      >
        <planeGeometry args={[ROOM_HALF_X * 2, ROOM_HALF_Z * 2]} />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, ROOM_HEIGHT, 0]}
        material={surfaceMats.ceiling}
      >
        <planeGeometry args={[ROOM_HALF_X * 2, ROOM_HALF_Z * 2]} />
      </mesh>

      {/* side + back walls */}
      <mesh
        rotation={[0, Math.PI / 2, 0]}
        position={[-ROOM_HALF_X, ROOM_HEIGHT / 2, 0]}
        material={surfaceMats.wall}
        receiveShadow
      >
        <planeGeometry args={[ROOM_HALF_Z * 2, ROOM_HEIGHT]} />
      </mesh>
      <mesh
        rotation={[0, -Math.PI / 2, 0]}
        position={[ROOM_HALF_X, ROOM_HEIGHT / 2, 0]}
        material={surfaceMats.wall}
        receiveShadow
      >
        <planeGeometry args={[ROOM_HALF_Z * 2, ROOM_HEIGHT]} />
      </mesh>
      <mesh
        rotation={[0, Math.PI, 0]}
        position={[0, ROOM_HEIGHT / 2, ROOM_HALF_Z]}
        material={surfaceMats.wall}
        receiveShadow
      >
        <planeGeometry args={[ROOM_HALF_X * 2, ROOM_HEIGHT]} />
      </mesh>

      {/* front wall around the window */}
      {frontWallPieces.map((p, i) => (
        <mesh key={i} position={p.pos} material={surfaceMats.wall} receiveShadow>
          <planeGeometry args={p.size} />
        </mesh>
      ))}

      {/* glow edges */}
      <lineSegments geometry={frameGeo} material={roomEdgeMat} />
      <lineSegments geometry={gridGeo} material={gridEdgeMat} />
      <lineSegments geometry={furnitureEdgeGeo} material={furnitureEdgeMat} />

      {/* furniture + screens: only the quickstart tabs are interactive —
          everything else is the room itself */}
      {screens.map(({ st, vis, mat, repaint }) => {
        const eul = new THREE.Euler(vis.screen.rotX, st.yaw, 0, "YXZ");
        const panelPos = vis.screen.pos
          .clone()
          .addScaledVector(new THREE.Vector3(0, 0, 1).applyEuler(eul), 0.028);
        return (
        <group key={st.id}>
          {vis.boxes.map((box, j) => (
            <mesh
              key={j}
              position={box.pos}
              rotation={[0, st.yaw, 0]}
              geometry={roundedGeos.get(`${st.id}-${j}`)}
              material={surfaceMats.furniture}
              castShadow
              receiveShadow
            />
          ))}
          {/* bezel frame: the env reflection on the frame sells "object" */}
          <mesh
            position={vis.screen.pos}
            rotation={new THREE.Euler(vis.screen.rotX, st.yaw, 0, "YXZ")}
            material={surfaceMats.bezel}
            castShadow
          >
            <boxGeometry
              args={[vis.screen.size[0] + 0.08, vis.screen.size[1] + 0.08, 0.05]}
            />
          </mesh>
          {/* panel proud of the bezel face */}
          <mesh position={panelPos} rotation={eul} material={mat}>
            <planeGeometry args={vis.screen.size} />
          </mesh>
          {/* quickstart tabs: one hit plane, tab derived from exact UV */}
          {st.contentKey === "craft" && repaint && (
            <mesh
              name="qs-hitplane"
              position={panelPos.clone().addScaledVector(new THREE.Vector3(0, 0, 1).applyEuler(eul), 0.003)}
              rotation={eul}
              onPointerMove={(e) => {
                e.stopPropagation();
                if (process.env.NODE_ENV !== "production") {
                  (window as unknown as Record<string, number>).__qsMove =
                    ((window as unknown as Record<string, number>).__qsMove ?? 0) + 1;
                }
                const t = e.uv ? uvToTab(e.uv.x, e.uv.y) : -1;
                if (t !== hotTabRef.current) {
                  hotTabRef.current = t;
                  repaint(t);
                }
              }}
              onPointerOut={() => {
                if (hotTabRef.current !== -1) {
                  hotTabRef.current = -1;
                  repaint(-1);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (walk.mode === "locked") return; // panel already open
                if (!clickGuard(e) || !e.uv) return;
                const t = uvToTab(e.uv.x, e.uv.y);
                if (t >= 0) onOpenSection(t);
              }}
            >
              <planeGeometry args={vis.screen.size} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
        );
      })}

      {/* the visitor's body */}
      <FirstPersonBody walk={walk} />
      <SpawnBeam walk={walk} />

      {/* the personality layer */}
      <BrainSign />
      <GymCorner />
      <RoomZones />

      {/* static set dressing: window architecture, chair, racks, cables,
          ceiling raft, wall panels, desk props */}
      <RoomDressing />

      {/* the neural storm outside the window */}
      <group position={[0, 0, -26]} scale={[0.9, 0.9, 0.9]}>
        <points geometry={stormGeo} material={stormMat} />
        <points geometry={stormShellGeo} material={stormShellMat} />
        <lineSegments geometry={stormTractGeo} material={stormTractMat} />
      </group>

      {/* room dust */}
      <points geometry={dustGeo} material={dustMat} />
    </>
  );
}

// ========================= CANVAS WRAPPER =========================

interface RoomSceneProps extends RoomSceneInnerProps {
  active: boolean;
}

export function RoomScene(props: RoomSceneProps) {
  const { active, walk } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);

  // drag-look uses window-level listeners for the session instead of
  // pointer capture: capture would retarget pointerup away from the
  // canvas and break r3f's click detection on the quickstart tabs
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (dragRef.current) return;
    const session = { id: e.pointerId, x: e.clientX, y: e.clientY };
    dragRef.current = session;
    walk.dragging = true;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== session.id || walk.mode === "locked") return;
      walk.lookDelta.x += ev.clientX - session.x;
      walk.lookDelta.y += ev.clientY - session.y;
      if (Math.abs(ev.clientX - session.x) + Math.abs(ev.clientY - session.y) > 2) {
        walk.hasMoved = true;
      }
      session.x = ev.clientX;
      session.y = ev.clientY;
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== session.id) return;
      dragRef.current = null;
      walk.dragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const isPortrait =
    typeof window !== "undefined" && window.innerWidth < window.innerHeight;

  return (
    <div
      ref={wrapperRef}
      data-brain-canvas
      tabIndex={-1}
      onPointerDown={onPointerDown}
      style={{
        position: "absolute",
        inset: 0,
        touchAction: "none",
        cursor: "grab",
      }}
    >
      <Canvas
        camera={{
          position: [0, 1.6, 3.6],
          fov: isPortrait ? 78 : 68,
          near: 0.08,
          far: 220,
        }}
        dpr={[1, 2]}
        shadows="soft"
        events={(store) => ({
          ...createEvents(store),
          // compute pointer from clientX/Y (offsetX is 0 for synthetic
          // events and fragile with transformed ancestors)
          compute(event, state) {
            const rect = state.gl.domElement.getBoundingClientRect();
            state.pointer.set(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              (-(event.clientY - rect.top) / rect.height) * 2 + 1
            );
            state.raycaster.setFromCamera(state.pointer, state.camera);
          },
        })}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: process.env.NODE_ENV !== "production",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
        frameloop={active ? "always" : "never"}
        style={{ width: "100%", height: "100%" }}
      >
        <RoomSceneInner {...props} />
      </Canvas>
    </div>
  );
}
