"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ROOM_HALF_Z } from "@/lib/room-world";

// The personality layer: the entrance sign and the themed "what occupies
// this brain" areas. Content here must be SPECIFIC to Alexander — the
// generic version of this room has no value.
//
// PLACEHOLDER MARKERS: strings tagged [owner] await the owner's real
// specifics (thoughts, PRs, books). Structure ships now; facts iterate.

// ========================= text sprite helpers =========================

export function textCanvas(
  lines: { text: string; size: number; color: string; italic?: boolean }[],
  w: number,
  pad = 24
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const lineH = lines.map((l) => l.size * 1.45);
  // never clip: grow the canvas to the measured text if the caller's
  // width estimate is too small
  {
    const probe = c.getContext("2d")!;
    let needed = 0;
    for (const l of lines) {
      probe.font = `${l.italic ? "italic " : ""}500 ${l.size}px ui-monospace, Menlo, monospace`;
      needed = Math.max(needed, probe.measureText(l.text).width);
    }
    w = Math.max(w, Math.ceil(needed + pad * 2));
  }
  c.width = w;
  c.height = Math.ceil(lineH.reduce((a, b) => a + b, 0) + pad * 2);
  const ctx = c.getContext("2d")!;
  let y = pad;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    ctx.font = `${l.italic ? "italic " : ""}500 ${l.size}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = l.color;
    ctx.textAlign = "center";
    y += lineH[i] * 0.72;
    ctx.fillText(l.text, w / 2, y);
    y += lineH[i] * 0.28;
  }
  return c;
}

// ========================= BRAIN SIGN =========================

// Glowing letters above the window — the first thing you read.
export function BrainSign() {
  const tex = useMemo(() => {
    const c = textCanvas(
      [
        { text: "A L E X A N D E R ' S   B R A I N", size: 64, color: "rgba(210,222,248,0.95)" },
        { text: "visitor access granted · mind operations in progress", size: 22, color: "rgba(178,196,232,0.55)" },
      ],
      1400
    );
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [tex]
  );
  useEffect(() => {
    return () => {
      tex.dispose();
      mat.dispose();
    };
  }, [tex, mat]);
  return (
    <mesh position={[0, 3.32, -ROOM_HALF_Z + 0.04]} material={mat}>
      <planeGeometry args={[4.6, 0.62]} />
    </mesh>
  );
}

// ========================= FLOATING THOUGHTS =========================

interface Thought {
  text: string;
  pos: [number, number, number];
  drift?: number;
  /** sprite scale multiplier */
  size?: number;
}

// readable thought bubble: dark rounded plate + colored border + italic text
function bubbleCanvas(text: string, color: string): HTMLCanvasElement {
  const probe = document.createElement("canvas").getContext("2d")!;
  const fontSize = 30;
  probe.font = `italic 500 ${fontSize}px ui-monospace, Menlo, monospace`;
  const tw = probe.measureText(`“${text}”`).width;
  const padX = 34;
  const padY = 26;
  const c = document.createElement("canvas");
  c.width = Math.ceil(tw + padX * 2);
  c.height = fontSize + padY * 2;
  const ctx = c.getContext("2d")!;
  ctx.beginPath();
  ctx.roundRect(2, 2, c.width - 4, c.height - 4, 18);
  ctx.fillStyle = "rgba(9, 11, 18, 0.82)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = `italic 500 ${fontSize}px ui-monospace, Menlo, monospace`;
  ctx.fillStyle = "rgba(226, 234, 250, 0.94)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`“${text}”`, c.width / 2, c.height / 2 + 2);
  return c;
}

export function FloatingThoughts({
  thoughts,
  color = "#b2c4e8",
}: {
  thoughts: Thought[];
  color?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const sprites = useMemo(
    () =>
      thoughts.map((th) => {
        const c = bubbleCanvas(th.text, color);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const mat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          opacity: 0.95,
          depthWrite: false,
          toneMapped: false,
        });
        const scale = 0.0021 * (th.size ?? 1);
        return { th, tex, mat, w: c.width * scale, h: c.height * scale };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    return () => {
      sprites.forEach((s) => {
        s.tex.dispose();
        s.mat.dispose();
      });
    };
  }, [sprites]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const cam = state.camera.position;
    g.children.forEach((child, i) => {
      const sp = sprites[i];
      if (!sp) return;
      const base = sp.th;
      const d = base.drift ?? 1;
      child.position.y = base.pos[1] + Math.sin(t * 0.4 * d + i * 2.1) * 0.06;
      child.position.x = base.pos[0] + Math.sin(t * 0.23 * d + i) * 0.04;
      // near thoughts read, far thoughts recede — stops the text pile-ups
      const dist = cam.distanceTo(child.position);
      sp.mat.opacity = THREE.MathUtils.clamp(1.45 - dist / 9, 0.12, 0.95);
    });
  });

  return (
    <group ref={groupRef}>
      {sprites.map((s, i) => (
        <sprite key={i} position={s.th.pos} scale={[s.w, s.h, 1]} material={s.mat} />
      ))}
    </group>
  );
}

// ========================= PHOTO FRAMES =========================

interface Photo {
  src: string;
  pos: [number, number, number];
  yaw: number;
  w: number;
  h: number;
  tilt?: number;
}

export function PhotoFrames({ photos }: { photos: Photo[] }) {
  const frameGeo = useMemo(() => new RoundedBoxGeometry(1, 1, 0.03, 1, 0.008), []);
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x181c28,
        roughness: 0.4,
        metalness: 0.6,
        envMapIntensity: 0.8,
      }),
    []
  );
  const loaded = useMemo(
    () =>
      photos.map((p) => {
        const tex = new THREE.TextureLoader().load(p.src, (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 4;
        });
        const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
        return { p, tex, mat };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => {
    return () => {
      frameGeo.dispose();
      frameMat.dispose();
      loaded.forEach((l) => {
        l.tex.dispose();
        l.mat.dispose();
      });
    };
  }, [frameGeo, frameMat, loaded]);

  return (
    <group>
      {loaded.map(({ p, mat }, i) => (
        <group key={i} position={p.pos} rotation={[p.tilt ?? 0, p.yaw, 0]}>
          <mesh geometry={frameGeo} scale={[p.w + 0.06, p.h + 0.06, 1]} material={frameMat} castShadow />
          <mesh position={[0, 0, 0.018]} material={mat}>
            <planeGeometry args={[p.w, p.h]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ========================= GYM / TRAINING CORNER =========================

// Themed area, right-back corner: a real corner of a real gym — rubber
// platform, power rack with a loaded bar, bench, shoe case, medal wall,
// training log, real photos, and the thoughts that live here.

export function GymCorner() {
  const mats = useMemo(
    () => ({
      metal: new THREE.MeshStandardMaterial({
        color: 0x1a1e26,
        roughness: 0.35,
        metalness: 0.85,
        envMapIntensity: 1.1,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: 0x14171c,
        roughness: 0.6,
        metalness: 0.3,
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: 0x0d0e12,
        roughness: 0.95,
        metalness: 0,
      }),
      pad: new THREE.MeshStandardMaterial({
        color: 0x181b22,
        roughness: 0.85,
        metalness: 0,
      }),
      bar: new THREE.MeshStandardMaterial({
        color: 0x9aa2b4,
        roughness: 0.25,
        metalness: 1.0,
        envMapIntensity: 1.4,
      }),
      plate: new THREE.MeshStandardMaterial({
        color: 0x22262f,
        roughness: 0.55,
        metalness: 0.6,
        envMapIntensity: 0.7,
      }),
      shoe: new THREE.MeshStandardMaterial({
        color: 0xe4e8f0,
        roughness: 0.55,
        metalness: 0,
      }),
      // Alphafly 3 racing orange
      shoeAccent: new THREE.MeshStandardMaterial({
        color: 0x3a1504,
        emissive: 0xff6a2a,
        emissiveIntensity: 1.15,
        roughness: 0.55,
        metalness: 0,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x0a0f18,
        transparent: true,
        opacity: 0.12,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.5,
        depthWrite: false,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xd8b56a,
        roughness: 0.22,
        metalness: 1.0,
        envMapIntensity: 1.7,
      }),
      silver: new THREE.MeshStandardMaterial({
        color: 0xb9c0cc,
        roughness: 0.25,
        metalness: 1.0,
        envMapIntensity: 1.5,
      }),
      ribbon: new THREE.MeshStandardMaterial({
        color: 0x30508c,
        roughness: 0.9,
        metalness: 0,
      }),
      board: new THREE.MeshStandardMaterial({
        color: 0x11141c,
        roughness: 0.5,
        metalness: 0.4,
        envMapIntensity: 0.6,
      }),
      matBorder: new THREE.MeshStandardMaterial({
        color: 0x0a0c10,
        emissive: 0xb2c4e8,
        emissiveIntensity: 0.7,
        roughness: 1,
        metalness: 0,
      }),
    }),
    []
  );
  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // training-log board texture (emissive screen on the back wall)
  const logTex = useMemo(() => {
    const c = textCanvas(
      [
        { text: "TRAINING LOG", size: 40, color: "rgba(210,222,248,0.95)" },
        { text: "──────────────────────", size: 20, color: "rgba(178,196,232,0.3)" },
        { text: "CPH MARATHON  sub-3 ✓", size: 26, color: "rgba(178,196,232,0.9)" },
        { text: "HYROX         finisher", size: 26, color: "rgba(178,196,232,0.8)" },
        { text: "PROTOCOL      if it moves, I'm in", size: 26, color: "rgba(178,196,232,0.8)" },
        { text: "REST DAYS     under review", size: 26, color: "rgba(178,196,232,0.5)" },
      ],
      680
    );
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const logMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: logTex,
        transparent: true,
        toneMapped: false,
      }),
    [logTex]
  );
  useEffect(() => {
    return () => {
      logTex.dispose();
      logMat.dispose();
    };
  }, [logTex, logMat]);

  const RACK_X = 5.95;
  const RACK_Z = 4.45;

  return (
    <group>
      {/* zone key light */}
      <spotLight
        color={0xffd9b8}
        intensity={16}
        position={[5.7, 3.4, 3.5]}
        angle={0.72}
        penumbra={0.85}
        distance={7}
        decay={2}
      />

      {/* rubber lifting platform with a glowing border */}
      <mesh position={[5.75, 0.021, 3.65]} material={mats.rubber} receiveShadow>
        <boxGeometry args={[2.7, 0.042, 2.4]} />
      </mesh>
      {[
        [5.75, 0.045, 2.46, 2.7, 0.012, 0.03],
        [5.75, 0.045, 4.84, 2.7, 0.012, 0.03],
        [4.41, 0.045, 3.65, 0.03, 0.012, 2.4],
        [6.99 - 0.09, 0.045, 3.65, 0.03, 0.012, 2.4],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`mb-${i}`} position={[x, y, z]} material={mats.matBorder}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* power rack against the back wall, bar racked at shoulder height */}
      <group position={[RACK_X, 0, RACK_Z]}>
        {[
          [-0.55, -0.25],
          [0.55, -0.25],
          [-0.55, 0.25],
          [0.55, 0.25],
        ].map(([x, z], i) => (
          <mesh key={`up-${i}`} position={[x, 1.1, z]} material={mats.metal} castShadow>
            <boxGeometry args={[0.08, 2.2, 0.08]} />
          </mesh>
        ))}
        {[
          [0, 2.16, -0.25, 1.18, 0.08, 0.08],
          [0, 2.16, 0.25, 1.18, 0.08, 0.08],
          [-0.55, 2.16, 0, 0.08, 0.08, 0.58],
          [0.55, 2.16, 0, 0.08, 0.08, 0.58],
        ].map(([x, y, z, w, h, d], i) => (
          <mesh key={`cross-${i}`} position={[x, y, z]} material={mats.metal}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
        ))}
        {/* j-hooks + barbell + plates */}
        {[-0.55, 0.55].map((x, i) => (
          <mesh key={`jh-${i}`} position={[x, 1.5, -0.31]} material={mats.dark}>
            <boxGeometry args={[0.1, 0.12, 0.06]} />
          </mesh>
        ))}
        <group position={[0, 1.58, -0.31]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={mats.bar}>
            <cylinderGeometry args={[0.016, 0.016, 2.2, 12]} />
          </mesh>
          {[-0.86, -0.79, 0.79, 0.86].map((off, i) => (
            <mesh key={`pl-${i}`} position={[0, off, 0]} material={mats.plate} castShadow>
              <cylinderGeometry args={[i === 0 || i === 3 ? 0.13 : 0.17, i === 0 || i === 3 ? 0.13 : 0.17, 0.035, 20]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* flat bench angled on the platform */}
      <group position={[5.15, 0, 3.15]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.42, 0]} material={mats.pad} castShadow>
          <boxGeometry args={[1.15, 0.09, 0.34]} />
        </mesh>
        {[-0.42, 0.42].map((x, i) => (
          <mesh key={i} position={[x, 0.19, 0]} material={mats.metal}>
            <boxGeometry args={[0.06, 0.38, 0.3]} />
          </mesh>
        ))}
      </group>

      {/* shoe display case: pedestal + glass + racing shoes */}
      <group position={[4.7, 0, 4.5]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0.5, 0]} material={mats.board} castShadow>
          <boxGeometry args={[0.6, 1.0, 0.55]} />
        </mesh>
        <mesh position={[0, 1.32, 0]} material={mats.glass}>
          <boxGeometry args={[0.54, 0.62, 0.5]} />
        </mesh>
        {/* shoes on a tilted stand inside */}
        <group position={[0, 1.12, 0]} rotation={[-0.35, 0.3, 0]}>
          {[-0.1, 0.1].map((x, i) => (
            <group key={i} position={[x, 0.1, 0]}>
              <mesh material={mats.shoeAccent}>
                <boxGeometry args={[0.085, 0.055, 0.31]} />
              </mesh>
              <mesh position={[0, 0.055, -0.015]} material={mats.shoe} castShadow>
                <boxGeometry args={[0.078, 0.055, 0.27]} />
              </mesh>
              {/* heel counter */}
              <mesh position={[0, 0.04, 0.13]} material={mats.shoeAccent}>
                <boxGeometry args={[0.08, 0.08, 0.03]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* medal wall: board + three medals + engraved plates */}
      <group position={[6.94, 1.85, 3.1]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh material={mats.board} castShadow>
          <boxGeometry args={[1.15, 1.35, 0.04]} />
        </mesh>
        {[
          [-0.32, 0.28, mats.gold],
          [0, 0.14, mats.silver],
          [0.32, 0.24, mats.gold],
        ].map(([x, drop, mat], i) => (
          <group key={`med-${i}`} position={[x as number, 0.5, 0.03]}>
            <mesh position={[-0.035, -(drop as number) / 2 + 0.02, 0]} rotation={[0, 0, 0.24]} material={mats.ribbon}>
              <boxGeometry args={[0.035, drop as number, 0.006]} />
            </mesh>
            <mesh position={[0.035, -(drop as number) / 2 + 0.02, 0]} rotation={[0, 0, -0.24]} material={mats.ribbon}>
              <boxGeometry args={[0.035, drop as number, 0.006]} />
            </mesh>
            <mesh position={[0, -(drop as number), 0.006]} rotation={[Math.PI / 2, 0, 0]} material={mat as THREE.Material} castShadow>
              <cylinderGeometry args={[0.085, 0.085, 0.014, 24]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* training log board on the back wall */}
      <mesh position={[5.9, 1.85, 4.955]} rotation={[0, Math.PI, 0]} material={logMat}>
        <planeGeometry args={[1.1, 0.75]} />
      </mesh>

      {/* real memories, grid-hung */}
      <PhotoFrames
        photos={[
          { src: "/whoiam/sport-hyrox.jpg", pos: [6.94, 1.95, 2.05], yaw: -Math.PI / 2, w: 0.66, h: 0.46 },
          { src: "/whoiam/sport-boxing.jpg", pos: [6.94, 1.35, 2.05], yaw: -Math.PI / 2, w: 0.66, h: 0.46 },
          { src: "/whoiam/adv-fuji.jpg", pos: [4.55, 1.95, 4.94], yaw: Math.PI, w: 0.62, h: 0.44 },
        ]}
      />

      {/* the thoughts that live in this corner */}
      <FloatingThoughts
        color="#ff9a5c"
        thoughts={[
          { text: "I don't want to eat chips, there aren't enough calories", pos: [5.15, 2.75, 2.7] },
          { text: "another mile, another day", pos: [6.3, 2.25, 3.2], drift: 1.4, size: 0.85 },
          { text: "light weight baby", pos: [5.9, 1.15, 2.9], drift: 1.7, size: 0.8 },
          { text: "pain is temporary, pride is forever", pos: [4.55, 1.7, 3.6], drift: 0.7, size: 0.9 },
          { text: "OMMS! obstacles make me stronger", pos: [5.7, 3.15, 4.1], drift: 0.9, size: 0.9 },
        ]}
      />

      {/* shoe + medal engravings */}
      <mesh position={[4.7, 0.02, 4.5]} visible={false} />
      <ShoeMedalPlates />

      {/* handstand line-drawing pinned by the platform */}
      <HandstandDrawing />

      {/* zone label */}
      <ZoneLabel text="TRAINING GROUNDS" sub="physical department" pos={[6.9, 2.6, 3.8]} yaw={-Math.PI / 2} color="rgba(255,170,110,0.95)" />
    </group>
  );
}

// engraved plates for the shoe case and the medal wall
function ShoeMedalPlates() {
  const plates = [
    { lines: [{ text: "NIKE ALPHAFLY 3", size: 26, color: "rgba(255,150,80,0.9)" }, { text: "race day only", size: 18, color: "rgba(178,196,232,0.55)" }], pos: [4.7, 0.93, 4.78] as [number, number, number], yaw: 0.35 + Math.PI, w: 0.5, h: 0.16 },
    { lines: [{ text: "CPH MARATHON · SUB-3 ✓", size: 26, color: "rgba(216,181,106,0.95)" }, { text: "the medal that hurt the most", size: 17, color: "rgba(178,196,232,0.5)" }], pos: [6.9, 1.02, 3.1] as [number, number, number], yaw: -Math.PI / 2, w: 0.75, h: 0.18 },
  ];
  return (
    <group>
      {plates.map((pl, i) => (
        <PlateBoard key={i} {...pl} />
      ))}
    </group>
  );
}

function PlateBoard({
  lines,
  pos,
  yaw,
  w,
  h,
}: {
  lines: { text: string; size: number; color: string }[];
  pos: [number, number, number];
  yaw: number;
  w: number;
  h: number;
}) {
  const tex = useMemo(() => {
    const c = textCanvas(lines, 620);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [tex]
  );
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

// chalk-style handstand figure on the back wall of the gym
function HandstandDrawing() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 320;
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = "rgba(210,222,248,0.75)";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    // inverted stick figure: hands on the ground, legs split up top
    ctx.beginPath();
    ctx.arc(128, 250, 22, 0, Math.PI * 2); // head (near the floor)
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 228);
    ctx.lineTo(128, 120); // torso up
    ctx.moveTo(128, 200);
    ctx.lineTo(88, 268); // arm L
    ctx.moveTo(128, 200);
    ctx.lineTo(168, 268); // arm R
    ctx.moveTo(128, 120);
    ctx.quadraticCurveTo(100, 70, 78, 46); // leg L
    ctx.moveTo(128, 120);
    ctx.quadraticCurveTo(162, 78, 186, 60); // leg R
    ctx.stroke();
    // ground line
    ctx.strokeStyle = "rgba(178,196,232,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 276);
    ctx.lineTo(196, 276);
    ctx.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [tex]
  );
  useEffect(() => {
    return () => {
      tex.dispose();
      mat.dispose();
    };
  }, [tex, mat]);
  return (
    <mesh position={[4.85, 1.7, 4.94 - 0.06]} rotation={[0, Math.PI, 0]} material={mat}>
      <planeGeometry args={[0.5, 0.62]} />
    </mesh>
  );
}

// ========================= zone label =========================

export function ZoneLabel({
  text,
  sub,
  pos,
  yaw,
  color = "rgba(210,222,248,0.9)",
}: {
  text: string;
  sub: string;
  pos: [number, number, number];
  yaw: number;
  color?: string;
}) {
  const tex = useMemo(() => {
    const c = textCanvas(
      [
        { text, size: 42, color },
        { text: sub, size: 20, color: "rgba(178,196,232,0.5)" },
      ],
      760
    );
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [tex]
  );
  useEffect(() => {
    return () => {
      tex.dispose();
      mat.dispose();
    };
  }, [tex, mat]);
  return (
    <mesh position={pos} rotation={[0, yaw, 0]} material={mat}>
      <planeGeometry args={[1.5, 0.4]} />
    </mesh>
  );
}
