"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ROOM_HALF_X, ROOM_HALF_Z } from "@/lib/room-world";
import {
  FloatingThoughts,
  PhotoFrames,
  ZoneLabel,
  textCanvas,
} from "./RoomPersona";

// The six departments of Alexander's brain — real books, real brands,
// real thoughts, per the owner's manifest. Covers live in
// /public/brain-assets (fetched from Open Library); brand icons from
// simple-icons; wordmark plaques carry brands without vector assets.

const L_WALL = -ROOM_HALF_X;
const R_WALL = ROOM_HALF_X;
const B_WALL = ROOM_HALF_Z;

// ========================= shared prop builders =========================

function useZoneMats() {
  return useMemo(
    () => ({
      shelf: new THREE.MeshStandardMaterial({
        color: 0x1a1e26,
        roughness: 0.4,
        metalness: 0.75,
        envMapIntensity: 1.0,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: 0x14171c,
        roughness: 0.6,
        metalness: 0.3,
      }),
      paperWhite: new THREE.MeshStandardMaterial({
        color: 0xe8ecf4,
        roughness: 0.9,
        metalness: 0,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        emissive: 0xb2c4e8,
        emissiveIntensity: 0.9,
        roughness: 1,
        metalness: 0,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: 0x8a93ad,
        roughness: 0.65,
        metalness: 0.1,
      }),
      water: new THREE.MeshPhysicalMaterial({
        color: 0x1d3450,
        transparent: true,
        opacity: 0.85,
        roughness: 0.08,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.4,
      }),
      tub: new THREE.MeshStandardMaterial({
        color: 0x252a36,
        roughness: 0.35,
        metalness: 0.5,
        envMapIntensity: 0.9,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: 0x4a3b2c,
        roughness: 0.75,
        metalness: 0,
      }),
    }),
    []
  );
}

// a real book: cover texture on the front face, tinted spine
function Book({
  src,
  pos,
  yaw,
  h = 0.34,
  lean = 0,
}: {
  src: string;
  pos: [number, number, number];
  yaw: number;
  h?: number;
  lean?: number;
}) {
  const w = h * 0.66;
  const d = 0.035;
  const { coverMat, bodyMat } = useMemo(() => {
    const tex = new THREE.TextureLoader().load(src, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    });
    return {
      coverMat: new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
      bodyMat: new THREE.MeshStandardMaterial({
        color: 0xd8dde8,
        roughness: 0.85,
        metalness: 0,
      }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    return () => {
      coverMat.map?.dispose();
      coverMat.dispose();
      bodyMat.dispose();
    };
  }, [coverMat, bodyMat]);
  return (
    <group position={pos} rotation={[0, yaw, lean]}>
      <mesh material={bodyMat} castShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh position={[0, 0, d / 2 + 0.001]} material={coverMat}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

// wall-mounted shelf plank
function Shelf({
  pos,
  yaw,
  width,
  mat,
}: {
  pos: [number, number, number];
  yaw: number;
  width: number;
  mat: THREE.Material;
}) {
  return (
    <mesh position={pos} rotation={[0, yaw, 0]} material={mat} castShadow>
      <boxGeometry args={[width, 0.035, 0.26]} />
    </mesh>
  );
}

// brand plaque: icon SVG (if available) above a wordmark, on a dark tile
function BrandPlaque({
  icon,
  label,
  pos,
  yaw,
  size = 0.42,
}: {
  icon?: string;
  label: string;
  pos: [number, number, number];
  yaw: number;
  size?: number;
}) {
  const { tileMat, iconMat, wordTex, wordMat } = useMemo(() => {
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x11141c,
      roughness: 0.45,
      metalness: 0.5,
      envMapIntensity: 0.7,
    });
    let iconMat: THREE.MeshBasicMaterial | null = null;
    if (icon) {
      const tex = new THREE.TextureLoader().load(icon, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
      });
      iconMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
      });
    }
    const c = textCanvas(
      [{ text: label, size: 34, color: "rgba(210,222,248,0.92)" }],
      Math.max(240, label.length * 24 + 60)
    );
    const wordTex = new THREE.CanvasTexture(c);
    wordTex.colorSpace = THREE.SRGBColorSpace;
    const wordMat = new THREE.MeshBasicMaterial({
      map: wordTex,
      transparent: true,
      toneMapped: false,
    });
    return { tileMat, iconMat, wordTex, wordMat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    return () => {
      tileMat.dispose();
      iconMat?.map?.dispose();
      iconMat?.dispose();
      wordTex.dispose();
      wordMat.dispose();
    };
  }, [tileMat, iconMat, wordTex, wordMat]);
  const hasIcon = !!iconMat;
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <mesh material={tileMat} castShadow>
        <boxGeometry args={[size, size * (hasIcon ? 1.15 : 0.5), 0.03]} />
      </mesh>
      {iconMat && (
        <mesh position={[0, size * 0.14, 0.017]} material={iconMat}>
          <planeGeometry args={[size * 0.52, size * 0.52]} />
        </mesh>
      )}
      <mesh
        position={[0, hasIcon ? -size * 0.4 : 0, 0.017]}
        material={wordMat}
      >
        <planeGeometry args={[size * 0.86, size * 0.24]} />
      </mesh>
    </group>
  );
}

// canvas text board (word dumps, metric tickers, drawings)
function TextBoard({
  lines,
  pos,
  yaw,
  w,
  h,
  draw,
}: {
  lines?: { text: string; size: number; color: string; italic?: boolean }[];
  pos: [number, number, number];
  yaw: number;
  w: number;
  h: number;
  draw?: (ctx: CanvasRenderingContext2D, cw: number, ch: number) => void;
}) {
  const { tex, mat } = useMemo(() => {
    let canvas: HTMLCanvasElement;
    if (draw) {
      canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = Math.round((640 * h) / w);
      const ctx = canvas.getContext("2d")!;
      draw(ctx, canvas.width, canvas.height);
    } else {
      canvas = textCanvas(lines ?? [], 640);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
    });
    return { tex, mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    return () => {
      tex.dispose();
      mat.dispose();
    };
  }, [tex, mat]);
  return (
    <mesh position={pos} rotation={[0, yaw, 0]} material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

// ========================= PSYCHOLOGY & FLOURISHING =========================

function PsychologyZone() {
  const mats = useZoneMats();
  const WALL_X = L_WALL + 0.06;
  return (
    <group>
      {/* bookshelf on the left wall above the personal desk corner */}
      <Shelf pos={[WALL_X + 0.13, 1.62, 2.3]} yaw={Math.PI / 2} width={1.4} mat={mats.shelf} />
      <Book src="/brain-assets/book-elephant-brain.jpg" pos={[WALL_X + 0.15, 1.82, 1.85]} yaw={Math.PI / 2} />
      <Book src="/brain-assets/book-mans-search.jpg" pos={[WALL_X + 0.15, 1.82, 2.22]} yaw={Math.PI / 2} lean={-0.08} />
      <Book src="/brain-assets/book-thinking-fast.jpg" pos={[WALL_X + 0.15, 1.82, 2.6]} yaw={Math.PI / 2} lean={0.12} />

      {/* the word dump — concepts orbiting this corner of the mind */}
      <TextBoard
        pos={[WALL_X + 0.02, 2.5, 2.3]}
        yaw={Math.PI / 2}
        w={1.9}
        h={0.9}
        draw={(ctx, cw, ch) => {
          const words: [string, number, number, number, number][] = [
            ["DUNNING–KRUGER", 40, 60, 30, 0.85],
            ["irrational beings", 300, 100, 26, 0.6],
            ["consumer psychology", 60, 160, 26, 0.7],
            ["the lemming effect", 330, 200, 24, 0.55],
            ["loss aversion", 80, 240, 22, 0.45],
            ["anchoring", 400, 260, 22, 0.5],
          ];
          for (const [word, x, y, size, a] of words) {
            ctx.font = `600 ${size}px ui-monospace, Menlo, monospace`;
            ctx.fillStyle = `rgba(196,210,240,${a})`;
            ctx.fillText(word, x, y);
          }
        }}
      />

      {/* meditation figure on a low plinth */}
      <group position={[-5.0, 0, 4.35]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.25, 0]} material={mats.dark} castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
        </mesh>
        {/* crossed legs base */}
        <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.skin} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.12, 16]} />
        </mesh>
        {/* torso */}
        <mesh position={[0, 0.74, 0]} material={mats.skin} castShadow>
          <sphereGeometry args={[0.12, 14, 12]} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.92, 0]} material={mats.skin} castShadow>
          <sphereGeometry args={[0.065, 12, 10]} />
        </mesh>
        {/* resting hands */}
        {[-0.12, 0.12].map((x, i) => (
          <mesh key={i} position={[x, 0.62, 0.1]} material={mats.skin}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        ))}
        {/* aura ring */}
        <mesh position={[0, 0.78, -0.02]} material={mats.accent}>
          <torusGeometry args={[0.2, 0.006, 8, 40]} />
        </mesh>
      </group>

      <FloatingThoughts
        color="#b18cff"
        thoughts={[
          { text: "how do you remain stoic without being cold?", pos: [-5.0, 2.15, 2.6], size: 0.9 },
          { text: "how do you trust yourself when your system is designed to deceive you?", pos: [-4.2, 2.85, 3.9], drift: 0.7, size: 0.85 },
        ]}
      />
      <ZoneLabel text="PSYCHOLOGY & FLOURISHING" sub="behavioral department" pos={[WALL_X + 0.02, 3.05, 2.9]} yaw={Math.PI / 2} color="rgba(190,155,255,0.95)" />
    </group>
  );
}

// ========================= GROWTH =========================

function GrowthZone() {
  const mats = useZoneMats();
  const WALL_X = L_WALL + 0.06;
  return (
    <group>
      {/* the growth shelf: Hormozi, Brunson trilogy, Ogilvy, Purple Cow */}
      <Shelf pos={[WALL_X + 0.13, 1.9, -1.6]} yaw={Math.PI / 2} width={2.3} mat={mats.shelf} />
      <Book src="/brain-assets/book-100m-leads.jpg" pos={[WALL_X + 0.15, 2.1, -2.55]} yaw={Math.PI / 2} />
      <Book src="/brain-assets/book-100m-offers.jpg" pos={[WALL_X + 0.15, 2.1, -2.2]} yaw={Math.PI / 2} lean={0.06} />
      <Book src="/brain-assets/book-dotcom-secrets.jpg" pos={[WALL_X + 0.15, 2.1, -1.85]} yaw={Math.PI / 2} />
      <Book src="/brain-assets/book-expert-secrets.jpg" pos={[WALL_X + 0.15, 2.1, -1.52]} yaw={Math.PI / 2} lean={-0.06} />
      <Book src="/brain-assets/book-traffic-secrets.jpg" pos={[WALL_X + 0.15, 2.1, -1.19]} yaw={Math.PI / 2} />
      <Shelf pos={[WALL_X + 0.13, 1.15, -1.6]} yaw={Math.PI / 2} width={2.3} mat={mats.shelf} />
      <Book src="/brain-assets/book-ogilvy.jpg" pos={[WALL_X + 0.15, 1.35, -2.1]} yaw={Math.PI / 2} />
      <Book src="/brain-assets/book-purple-cow.jpg" pos={[WALL_X + 0.15, 1.35, -1.72]} yaw={Math.PI / 2} lean={0.1} />

      {/* the metric ticker — the numbers that live rent-free here */}
      <TextBoard
        pos={[WALL_X + 0.02, 2.72, -1.6]}
        yaw={Math.PI / 2}
        w={2.4}
        h={0.5}
        draw={(ctx, cw, ch) => {
          ctx.font = "600 30px ui-monospace, Menlo, monospace";
          const metrics = ["ROAS", "CAC", "R₀", "MER", "CR", "CPL", "LEAD/LAG"];
          let x = 14;
          for (const m of metrics) {
            ctx.fillStyle = "rgba(178,196,232,0.32)";
            ctx.beginPath();
            ctx.roundRect(x - 6, ch / 2 - 26, ctx.measureText(m).width + 22, 44, 8);
            ctx.stroke?.();
            ctx.strokeStyle = "rgba(178,196,232,0.35)";
            ctx.stroke();
            ctx.fillStyle = "rgba(210,222,248,0.85)";
            ctx.fillText(m, x + 4, ch / 2 + 8);
            x += ctx.measureText(m).width + 40;
          }
        }}
      />

      {/* brand wall: the teachers */}
      <BrandPlaque label="the ad professor" pos={[WALL_X + 0.05, 0.62, -2.4]} yaw={Math.PI / 2} />
      <BrandPlaque label="growth.design" pos={[WALL_X + 0.05, 0.62, -1.6]} yaw={Math.PI / 2} />
      <BrandPlaque label="Demand Curve" pos={[WALL_X + 0.05, 0.62, -0.8]} yaw={Math.PI / 2} />
      <BrandPlaque label="HEROIC" pos={[WALL_X + 0.05, 3.0, -0.6]} yaw={Math.PI / 2} size={0.5} />

      <FloatingThoughts
        color="#5fe39a"
        thoughts={[
          { text: "how do we deliver 10x the value?", pos: [-5.5, 2.25, -0.3], size: 0.9 },
          { text: "be so good they can't ignore you.", pos: [-4.8, 2.8, -2.4], drift: 1.3, size: 0.9 },
        ]}
      />
      <ZoneLabel text="GROWTH" sub="acquisition department" pos={[WALL_X + 0.02, 3.3, -1.6]} yaw={Math.PI / 2} color="rgba(120,235,165,0.95)" />
    </group>
  );
}

// ========================= ENTREPRENEURSHIP =========================

function EntrepreneurshipZone() {
  const mats = useZoneMats();
  const WALL_X = R_WALL - 0.06;
  return (
    <group>
      {/* the iceKore Challenger Tub — modeled on the real product:
          wooden stave barrel, steel bands, slatted lid leaning against
          the side, step platform, external chiller unit */}
      <IceKoreTub position={[4.9, 0, -2.4]} yaw={-0.35} />

      {/* books on the plotter-side shelf */}
      <Shelf pos={[WALL_X - 0.13, 2.05, -3.6]} yaw={Math.PI / 2} width={1.1} mat={mats.shelf} />
      <Book src="/brain-assets/book-zero-to-one.jpg" pos={[WALL_X - 0.15, 2.25, -3.8]} yaw={-Math.PI / 2} />
      <Book src="/brain-assets/book-lean-startup.jpg" pos={[WALL_X - 0.15, 2.25, -3.42]} yaw={-Math.PI / 2} lean={-0.09} />

      {/* venture wall: clubs, festivals, media, brands */}
      <BrandPlaque label="FC Nordsjælland" pos={[WALL_X - 0.05, 1.5, -4.1]} yaw={-Math.PI / 2} />
      <BrandPlaque label="Musik i Lejet" pos={[WALL_X - 0.05, 1.5, -3.3]} yaw={-Math.PI / 2} />
      <BrandPlaque label="TV2" pos={[WALL_X - 0.05, 0.85, -4.1]} yaw={-Math.PI / 2} />
      <BrandPlaque label="RødGlød" pos={[WALL_X - 0.05, 0.85, -3.3]} yaw={-Math.PI / 2} />

      <FloatingThoughts
        color="#7fd0ff"
        thoughts={[
          { text: "why has no one reinvented the fork? I'm sure I could design it better.", pos: [4.0, 2.35, -1.5], drift: 0.8, size: 0.9 },
        ]}
      />
      <ZoneLabel text="ENTREPRENEURSHIP" sub="ventures department" pos={[WALL_X - 0.02, 2.7, -3.7]} yaw={-Math.PI / 2} color="rgba(140,205,255,0.95)" />
    </group>
  );
}

// ========================= AI LAB =========================

function AiLabZone() {
  return (
    <group>
      {/* DAILY DRIVERS: the tool wall, one designed board */}
      <ToolWall />

      {/* the fleet hologram: five agents orbiting a core */}
      <FleetHologram position={[-2.55, 0, -4.0]} />

      {/* thoughts live ON the AI wall, out of the quickstart sightline */}
      <FloatingThoughts
        color="#6ee7ff"
        thoughts={[
          { text: "should I do this 20-minute task, or spend 5 hours vibe-coding an over-engineered solution I probably don't need?", pos: [-5.9, 3.18, -4.4], drift: 0.5, size: 0.72 },
          { text: "how do people live without Claude Max?", pos: [-6.55, 2.1, -3.2], drift: 1.0, size: 0.78 },
          { text: "hey Claude, fix this while I'm on the beach", pos: [-3.15, 3.28, -4.45], drift: 0.7, size: 0.78 },
        ]}
      />
      <ZoneLabel text="AI LAB" sub="the agent fleet lives here" pos={[-4.7, 3.42, -4.9]} yaw={0} color="rgba(120,225,255,0.95)" />
    </group>
  );
}

// one designed board instead of scattered plaques
function ToolWall() {
  const TOOLS: { icon?: string; label: string }[] = [
    { icon: "/brain-assets/logo-claude.svg", label: "Claude" },
    { icon: "/brain-assets/logo-n8n.svg", label: "n8n" },
    { icon: "/brain-assets/logo-gemini.svg", label: "Gemini" },
    { label: "Wispr Flow" },
    { icon: "/brain-assets/logo-openai.svg", label: "Whisper" },
    { icon: "/brain-assets/logo-github.svg", label: "GitHub" },
  ];
  const mats = useMemo(
    () => ({
      board: new THREE.MeshStandardMaterial({
        color: 0x10131c,
        roughness: 0.5,
        metalness: 0.45,
        envMapIntensity: 0.7,
      }),
      tile: new THREE.MeshStandardMaterial({
        color: 0x171b28,
        roughness: 0.4,
        metalness: 0.55,
        envMapIntensity: 0.9,
      }),
      strip: new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        emissive: 0x67e8f9,
        emissiveIntensity: 1.3,
        roughness: 1,
        metalness: 0,
      }),
    }),
    []
  );
  useEffect(() => {
    return () => Object.values(mats).forEach((m) => m.dispose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const W = 2.5;
  return (
    <group position={[-4.7, 0.5, -3.95]} rotation={[0, 0.18, 0]}>
      {/* plinth keeps the rail grounded */}
      <mesh position={[0, -0.28, -0.06]} material={mats.tile} castShadow>
        <boxGeometry args={[2.2, 0.36, 0.26]} />
      </mesh>
      {/* the rail leans back toward the big screen like a switch panel */}
      <group rotation={[-0.42, 0, 0]}>
        <mesh material={mats.board} castShadow>
          <boxGeometry args={[W, 0.72, 0.06]} />
        </mesh>
        <mesh position={[0, 0.3, 0.035]} material={mats.strip}>
          <boxGeometry args={[W - 0.12, 0.012, 0.01]} />
        </mesh>
        <TextBoard
          lines={[{ text: "DAILY DRIVERS", size: 30, color: "rgba(140,230,255,0.95)" }]}
          pos={[0, 0.25, 0.045]}
          yaw={0}
          w={0.9}
          h={0.1}
        />
        {TOOLS.map((tool, i) => (
          <group key={tool.label} position={[-W / 2 + 0.28 + i * ((W - 0.5) / 5), -0.1, 0.05]}>
            <mesh material={mats.tile} castShadow>
              <boxGeometry args={[0.36, 0.44, 0.03]} />
            </mesh>
            {tool.icon && <IconPlane src={tool.icon} pos={[0, 0.06, 0.018]} size={0.22} />}
            <TextBoard
              lines={[{ text: tool.label, size: 26, color: "rgba(215,228,248,0.9)" }]}
              pos={[0, tool.icon ? -0.14 : 0, 0.018]}
              yaw={0}
              w={0.32}
              h={0.07}
            />
          </group>
        ))}
      </group>
    </group>
  );
}

function IconPlane({
  src,
  pos,
  size,
}: {
  src: string;
  pos: [number, number, number];
  size: number;
}) {
  const mat = useMemo(() => {
    const tex = new THREE.TextureLoader().load(src, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    });
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    return () => {
      mat.map?.dispose();
      mat.dispose();
    };
  }, [mat]);
  return (
    <mesh position={pos} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}

// five agents orbiting a glowing core on a pedestal — the fleet, alive
function FleetHologram({ position }: { position: [number, number, number] }) {
  const orbitRef = useRef<THREE.Group>(null);
  const mats = useMemo(
    () => ({
      ped: new THREE.MeshStandardMaterial({
        color: 0x14171f,
        roughness: 0.4,
        metalness: 0.7,
        envMapIntensity: 0.9,
      }),
      ring: new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        emissive: 0x67e8f9,
        emissiveIntensity: 1.8,
        roughness: 1,
        metalness: 0,
      }),
      core: new THREE.MeshStandardMaterial({
        color: 0x0a1218,
        emissive: 0x9be8ff,
        emissiveIntensity: 2.6,
        roughness: 0.6,
        metalness: 0,
      }),
      agent: new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        emissive: 0x67e8f9,
        emissiveIntensity: 2.2,
        roughness: 1,
        metalness: 0,
      }),
      orbit: new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.18,
        toneMapped: false,
      }),
    }),
    []
  );
  useEffect(() => {
    return () => Object.values(mats).forEach((m) => m.dispose());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFrame((state) => {
    const g = orbitRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = t * 0.5;
    g.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 1.1 + i * 1.7) * 0.05;
    });
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} material={mats.ped} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.84, 20]} />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.ring}>
        <torusGeometry args={[0.2, 0.012, 8, 32]} />
      </mesh>
      {/* the core */}
      <mesh position={[0, 1.22, 0]} material={mats.core}>
        <sphereGeometry args={[0.085, 18, 14]} />
      </mesh>
      {/* orbit plane */}
      <mesh position={[0, 1.22, 0]} rotation={[Math.PI / 2.3, 0, 0]} material={mats.orbit}>
        <torusGeometry args={[0.34, 0.004, 6, 48]} />
      </mesh>
      {/* the agents */}
      <group ref={orbitRef} position={[0, 1.22, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34]} material={mats.agent}>
              <sphereGeometry args={[0.028, 10, 8]} />
            </mesh>
          );
        })}
      </group>
      <TextBoard
        lines={[{ text: "FLEET · 5 ACTIVE", size: 24, color: "rgba(140,230,255,0.9)" }]}
        pos={[0, 0.62, 0.27]}
        yaw={0}
        w={0.42}
        h={0.08}
      />
    </group>
  );
}

// ========================= LIVING =========================// ========================= LIVING =========================

function LivingZone() {
  return (
    <group>
      {/* the memory wall: doing awesome shit */}
      <PhotoFrames
        photos={[
          { src: "/whoiam/adv-skydiving.jpg", pos: [-2.4, 2.25, B_WALL - 0.11], yaw: Math.PI, w: 0.72, h: 0.5 },
          { src: "/whoiam/adv-paragliding.jpg", pos: [-1.55, 2.25, B_WALL - 0.11], yaw: Math.PI, w: 0.72, h: 0.5 },
          { src: "/whoiam/adv-glacier-climb.jpg", pos: [-2.4, 1.62, B_WALL - 0.11], yaw: Math.PI, w: 0.72, h: 0.5 },
          { src: "/whoiam/adv-sharks.jpg", pos: [-1.55, 1.62, B_WALL - 0.11], yaw: Math.PI, w: 0.72, h: 0.5 },
          { src: "/whoiam/adv-dolomites-group.jpg", pos: [-2.4, 0.99, B_WALL - 0.11], yaw: Math.PI, w: 0.72, h: 0.5 },
          { src: "/whoiam/adv-hawaii-summit.jpg", pos: [-1.55, 0.99, B_WALL - 0.11], yaw: Math.PI, w: 0.72, h: 0.5 },
        ]}
      />
      <ZoneLabel text="LIVING" sub="doing awesome shit" pos={[-1.97, 2.75, B_WALL - 0.09]} yaw={Math.PI} color="rgba(255,195,130,0.95)" />

      {/* quotes drift in the air, clear of the big screen's sightline */}
      <FloatingThoughts
        color="#ffc382"
        thoughts={[
          { text: "a stranger is just a friend you haven't met yet", pos: [-1.9, 2.95, 2.9], drift: 0.5, size: 0.85 },
          { text: "memento mori", pos: [3.4, 2.95, 1.2], drift: 0.4, size: 0.8 },
          { text: "wu wei", pos: [-3.2, 3.1, 0.6], drift: 0.6, size: 0.8 },
        ]}
      />
    </group>
  );
}


// ========================= ICEKORE CHALLENGER TUB =========================

// vertical thermowood staves, painted procedurally
function makeStaveTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const staveW = 512 / 14;
  for (let i = 0; i < 14; i++) {
    const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const base = 96 + Math.abs(jitter) * 34;
    ctx.fillStyle = `rgb(${base + 44}, ${base + 8}, ${Math.max(30, base - 34)})`;
    ctx.fillRect(i * staveW, 0, staveW, 256);
    // grain streaks
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#3a2412";
    for (let g = 0; g < 5; g++) {
      const gx = i * staveW + ((Math.abs(jitter) * 97 + g * 7.3) % staveW);
      ctx.fillRect(gx, 0, 1.2, 256);
    }
    ctx.globalAlpha = 1;
    // stave gap
    ctx.fillStyle = "rgba(20, 10, 4, 0.85)";
    ctx.fillRect(i * staveW, 0, 2, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function IceKoreTub({
  position,
  yaw,
}: {
  position: [number, number, number];
  yaw: number;
}) {
  const R = 0.62; // barrel radius
  const H = 1.02; // barrel height
  const { staveTex, mats, wordTex, wordMat } = useMemo(() => {
    const staveTex = makeStaveTexture();
    const mats = {
      wood: new THREE.MeshStandardMaterial({
        map: staveTex,
        roughness: 0.72,
        metalness: 0,
        envMapIntensity: 0.35,
      }),
      woodPlain: new THREE.MeshStandardMaterial({
        color: 0x8d5f3a,
        roughness: 0.75,
        metalness: 0,
      }),
      woodDark: new THREE.MeshStandardMaterial({
        color: 0x5e3d24,
        roughness: 0.8,
        metalness: 0,
      }),
      band: new THREE.MeshStandardMaterial({
        color: 0x9aa2ae,
        roughness: 0.3,
        metalness: 0.95,
        envMapIntensity: 1.3,
      }),
      inner: new THREE.MeshStandardMaterial({
        color: 0x1a222e,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.BackSide,
      }),
      water: new THREE.MeshPhysicalMaterial({
        color: 0x2a4a68,
        transparent: true,
        opacity: 0.92,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.5,
      }),
      chiller: new THREE.MeshStandardMaterial({
        color: 0x181c22,
        roughness: 0.45,
        metalness: 0.55,
        envMapIntensity: 0.8,
      }),
      chillerVent: new THREE.MeshStandardMaterial({
        color: 0x0c0f14,
        roughness: 0.7,
        metalness: 0.3,
      }),
      hose: new THREE.MeshStandardMaterial({
        color: 0x14171c,
        roughness: 0.5,
        metalness: 0.1,
      }),
      led: new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        emissive: 0x7fd0ff,
        emissiveIntensity: 2.2,
        roughness: 1,
        metalness: 0,
      }),
    };
    // the iceKore wordmark, matching the site: lowercase ice + capital K
    const wc = document.createElement("canvas");
    wc.width = 512;
    wc.height = 128;
    const wctx = wc.getContext("2d")!;
    wctx.beginPath();
    wctx.roundRect(6, 6, 500, 116, 24);
    wctx.fillStyle = "rgba(246, 248, 252, 0.96)";
    wctx.fill();
    wctx.font = "700 64px -apple-system, 'Helvetica Neue', Arial, sans-serif";
    wctx.fillStyle = "#101319";
    wctx.textAlign = "center";
    wctx.textBaseline = "middle";
    wctx.fillText("iceKore", 276, 68);
    // snowflake-ish mark
    wctx.strokeStyle = "#101319";
    wctx.lineWidth = 5;
    for (let a = 0; a < 6; a++) {
      wctx.beginPath();
      wctx.moveTo(64, 64);
      wctx.lineTo(64 + Math.cos((a * Math.PI) / 3) * 26, 64 + Math.sin((a * Math.PI) / 3) * 26);
      wctx.stroke();
    }
    const wordTex = new THREE.CanvasTexture(wc);
    wordTex.colorSpace = THREE.SRGBColorSpace;
    wordTex.anisotropy = 4;
    const wordMat = new THREE.MeshBasicMaterial({
      map: wordTex,
      transparent: true,
      toneMapped: false,
    });
    return { staveTex, mats, wordTex, wordMat };
  }, []);
  useEffect(() => {
    return () => {
      staveTex.dispose();
      wordTex.dispose();
      wordMat.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* barrel staves */}
      <mesh position={[0, H / 2, 0]} material={mats.wood} castShadow receiveShadow>
        <cylinderGeometry args={[R, R * 0.94, H, 28, 1, true]} />
      </mesh>
      {/* inner wall + rim */}
      <mesh position={[0, H / 2 + 0.01, 0]} material={mats.inner}>
        <cylinderGeometry args={[R - 0.035, R - 0.035, H, 28, 1, true]} />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.woodDark}>
        <torusGeometry args={[R - 0.02, 0.028, 10, 40]} />
      </mesh>
      {/* the cold water */}
      <mesh position={[0, H - 0.12, 0]} material={mats.water}>
        <cylinderGeometry args={[R - 0.05, R - 0.05, 0.02, 28]} />
      </mesh>
      {/* steel bands like the product */}
      {[0.16, 0.52, 0.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.band}>
          <torusGeometry args={[R + 0.012 - (0.94 - (y / H) * 0.06) * 0, 0.014, 8, 44]} />
        </mesh>
      ))}
      {/* slatted lid leaning against the barrel (as on icekore.dk) */}
      <group position={[R + 0.28, 0.62, 0.25]} rotation={[0, 0.35, -1.18]}>
        <mesh material={mats.woodPlain} castShadow>
          <cylinderGeometry args={[R - 0.02, R - 0.02, 0.05, 28]} />
        </mesh>
        {[-0.26, 0, 0.26].map((x, i) => (
          <mesh key={i} position={[x, 0.035, 0]} material={mats.woodDark}>
            <boxGeometry args={[0.09, 0.02, R * 1.5 - Math.abs(x)]} />
          </mesh>
        ))}
        {/* lid handle */}
        <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.band}>
          <torusGeometry args={[0.07, 0.012, 8, 20]} />
        </mesh>
      </group>
      {/* step platform */}
      <mesh position={[0, 0.12, R + 0.28]} material={mats.woodPlain} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.24, 0.42]} />
      </mesh>
      <mesh position={[0, 0.33, R + 0.13]} material={mats.woodDark} castShadow>
        <boxGeometry args={[0.85, 0.18, 0.22]} />
      </mesh>
      {/* external chiller unit + hose */}
      <group position={[-R - 0.55, 0, -0.15]}>
        <mesh position={[0, 0.42, 0]} material={mats.chiller} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.84, 0.5]} />
        </mesh>
        {[0.2, 0.34, 0.48, 0.62].map((y, i) => (
          <mesh key={i} position={[0.245, y, 0]} material={mats.chillerVent}>
            <boxGeometry args={[0.012, 0.06, 0.4]} />
          </mesh>
        ))}
        <mesh position={[0.2, 0.78, 0.18]} material={mats.led}>
          <boxGeometry args={[0.03, 0.012, 0.012]} />
        </mesh>
        {/* hose into the barrel */}
        <mesh position={[0.35, 0.72, 0]} rotation={[0, 0, -0.9]} material={mats.hose}>
          <cylinderGeometry args={[0.03, 0.03, 0.55, 10]} />
        </mesh>
      </group>
      {/* iceKore wordmark badge on the barrel face */}
      <mesh position={[0, 0.56, R + 0.015]} material={wordMat}>
        <planeGeometry args={[0.56, 0.14]} />
      </mesh>
    </group>
  );
}

// ========================= EXPORT =========================

export function RoomZones() {
  return (
    <group>
      <PsychologyZone />
      <GrowthZone />
      <EntrepreneurshipZone />
      <AiLabZone />
      <LivingZone />
      {/* Training zone lives in RoomPersona's GymCorner */}
    </group>
  );
}
