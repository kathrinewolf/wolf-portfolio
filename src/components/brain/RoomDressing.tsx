"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  ROOM_HALF_X,
  ROOM_HALF_Z,
  ROOM_HEIGHT,
  WINDOW,
} from "@/lib/room-world";
import { makeFloorMarkings } from "@/lib/room-textures";

// Static set dressing for the Operator's Room: the props that make it a
// place someone works in. All procedural primitives, shared materials.

const Z_FRONT = -ROOM_HALF_Z;

// ---- shared materials ----

function useDressingMaterials() {
  return useMemo(() => {
    const frame = new THREE.MeshStandardMaterial({
      color: 0x1a1e26,
      roughness: 0.4,
      metalness: 0.8,
      envMapIntensity: 1.2,
    });
    const body = new THREE.MeshStandardMaterial({
      color: 0x14171c,
      roughness: 0.55,
      metalness: 0.35,
      envMapIntensity: 0.5,
    });
    const soft = new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.9,
      metalness: 0,
    });
    const cable = new THREE.MeshStandardMaterial({
      color: 0x0c0e12,
      roughness: 0.35,
      metalness: 0.1,
    });
    const paper = new THREE.MeshStandardMaterial({
      color: 0xd9dde6,
      roughness: 0.95,
      metalness: 0,
    });
    const emissive = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      emissive: 0xb2c4e8,
      emissiveIntensity: 2.2,
      roughness: 1,
      metalness: 0,
    });
    const emissiveSoft = new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      emissive: 0xb2c4e8,
      emissiveIntensity: 0.8,
      roughness: 1,
      metalness: 0,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x0a0f18,
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
      depthWrite: false,
    });
    const mug = new THREE.MeshStandardMaterial({
      color: 0xcfd6e4,
      roughness: 0.4,
      metalness: 0,
    });
    const coffee = new THREE.MeshStandardMaterial({
      color: 0x241a12,
      roughness: 0.3,
      metalness: 0,
    });
    return { frame, body, soft, cable, paper, emissive, emissiveSoft, glass, mug, coffee };
  }, []);
}

// ---- LED field on the server racks (additive sprites) ----

const ledVert = `
  uniform float uTime;
  attribute float aPhase;
  attribute float aMode;
  varying float vB;
  void main() {
    float b = 0.8;
    if (aMode > 1.5) {
      // irregular flicker
      b = step(0.86, fract(sin(aPhase * 91.7 + floor(uTime * 6.0)) * 43758.5453)) * 0.9 + 0.15;
    } else if (aMode > 0.5) {
      b = 0.5 + 0.45 * sin(uTime * 0.7 + aPhase);
    }
    vB = b;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = min(9.0 * (60.0 / -mv.z), 10.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const ledFrag = `
  varying float vB;
  uniform vec3 uColorA;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float i = exp(-d * d * 16.0) * vB;
    gl_FragColor = vec4(uColorA * i, i);
  }
`;

interface RackSpec {
  pos: [number, number, number];
  yaw: number;
}

const RACKS: RackSpec[] = [
  { pos: [-2.05, 1.1, -4.55], yaw: 0 },
  { pos: [3.75, 1.1, -4.55], yaw: 0 },
  { pos: [6.55, 1.1, 1.7], yaw: -Math.PI / 2 },
  { pos: [4.35, 1.1, 4.55], yaw: Math.PI },
];

function RackLeds() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const pts: number[] = [];
    const phases: number[] = [];
    const modes: number[] = [];
    let s = 424242;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    for (const rack of RACKS) {
      m.makeRotationY(rack.yaw).setPosition(rack.pos[0], rack.pos[1], rack.pos[2]);
      for (let blade = 0; blade < 9; blade++) {
        const y = -0.85 + blade * 0.21;
        for (const x of [-0.18, -0.12, 0.14, 0.19]) {
          v.set(x, y, 0.37).applyMatrix4(m);
          pts.push(v.x, v.y, v.z);
          phases.push(rand() * Math.PI * 2);
          const r = rand();
          modes.push(r < 0.05 ? 2 : r < 0.2 ? 1 : 0);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(phases), 1));
    g.setAttribute("aMode", new THREE.BufferAttribute(new Float32Array(modes), 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ledVert,
        fragmentShader: ledFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColorA: { value: new THREE.Color(0.7, 0.77, 0.95) },
        },
      }),
    []
  );
  useEffect(() => {
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geo, mat]);
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return <points geometry={geo} material={mat} ref={() => void (matRef.current = mat)} />;
}

// ---- cable runs ----

function cablePath(points: [number, number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
  );
}

const CABLES: { pts: [number, number, number][]; r: number; emissive?: boolean }[] = [
  // console -> monitor wall
  { pts: [[-0.9, 0.75, -3.5], [-1.3, 0.1, -4.2], [-2.4, 0.02, -4.75], [-4.2, 0.02, -4.8], [-4.85, 0.35, -4.7]], r: 0.02 },
  // console -> right rack
  { pts: [[0.9, 0.72, -3.5], [1.5, 0.05, -4.3], [3.4, 0.02, -4.7], [3.72, 0.4, -4.6]], r: 0.02 },
  // right rack -> plotter
  { pts: [[3.9, 0.02, -4.68], [6.55, 0.02, -4.4], [6.7, 0.02, -0.6], [6.55, 0.5, -1.0]], r: 0.02 },
  // plotter -> transmitter
  { pts: [[6.6, 0.02, 1.0], [6.5, 0.02, 3.8], [4.6, 0.02, 4.75], [3.35, 0.4, 4.7]], r: 0.014 },
  // personal desk drop
  { pts: [[-5.6, 0.72, 3.8], [-5.9, 0.15, 4.4], [-6.5, 0.02, 4.4], [-6.85, 0.02, 2.0]], r: 0.01 },
  // glowing data conduit accent
  { pts: [[0.95, 0.7, -3.45], [1.55, 0.08, -4.25], [3.45, 0.05, -4.65], [3.76, 0.42, -4.55]], r: 0.008, emissive: true },
];

// ---- the component ----

export function RoomDressing() {
  const mats = useDressingMaterials();

  const cableGeos = useMemo(
    () =>
      CABLES.map(
        (c) => new THREE.TubeGeometry(cablePath(c.pts), 48, c.r, 6, false)
      ),
    []
  );

  const markingsTex = useMemo(() => makeFloorMarkings(), []);
  const markingsMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: markingsTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    [markingsTex]
  );

  useEffect(() => {
    return () => {
      cableGeos.forEach((g) => g.dispose());
      markingsTex.dispose();
      markingsMat.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const W = WINDOW;

  return (
    <group>
      {/* ---------- floor markings decal ---------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} material={markingsMat}>
        <planeGeometry args={[ROOM_HALF_X * 2, ROOM_HALF_Z * 2]} />
      </mesh>

      {/* ---------- window architecture ---------- */}
      {/* header / sill / jambs */}
      <mesh position={[0, W.y1 + 0.06, Z_FRONT + 0.17]} material={mats.frame} castShadow>
        <boxGeometry args={[W.x1 - W.x0 + 0.3, 0.12, 0.35]} />
      </mesh>
      <mesh position={[0, W.y0 - 0.05, Z_FRONT + 0.2]} material={mats.frame} castShadow>
        <boxGeometry args={[W.x1 - W.x0 + 0.3, 0.1, 0.42]} />
      </mesh>
      {[W.x0 - 0.06, W.x1 + 0.06].map((x, i) => (
        <mesh key={i} position={[x, (W.y0 + W.y1) / 2, Z_FRONT + 0.17]} material={mats.frame} castShadow>
          <boxGeometry args={[0.12, W.y1 - W.y0 + 0.02, 0.35]} />
        </mesh>
      ))}
      {/* mullions + transom — these throw the window shadows */}
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={i} position={[x, (W.y0 + W.y1) / 2, Z_FRONT + 0.1]} material={mats.frame} castShadow>
          <boxGeometry args={[0.06, W.y1 - W.y0, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 2.55, Z_FRONT + 0.1]} material={mats.frame} castShadow>
        <boxGeometry args={[W.x1 - W.x0, 0.05, 0.1]} />
      </mesh>
      {/* emissive sill strip uplighting the mullions */}
      <mesh position={[0, W.y0 + 0.01, Z_FRONT + 0.12]} material={mats.emissiveSoft}>
        <boxGeometry args={[W.x1 - W.x0 - 0.1, 0.015, 0.02]} />
      </mesh>
      {/* glass */}
      <mesh position={[0, (W.y0 + W.y1) / 2, Z_FRONT + 0.03]} material={mats.glass}>
        <planeGeometry args={[W.x1 - W.x0, W.y1 - W.y0]} />
      </mesh>

      {/* ---------- operator chair (just vacated) ---------- */}
      <group position={[1.15, 0, -2.15]} rotation={[0, Math.PI + 0.85, 0]}>
        {/* hub + lift */}
        <mesh position={[0, 0.1, 0]} material={mats.frame} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
        </mesh>
        <mesh position={[0, 0.25, 0]} material={mats.frame}>
          <cylinderGeometry args={[0.03, 0.03, 0.26, 10]} />
        </mesh>
        <mesh position={[0, 0.18, 0]} material={mats.frame}>
          <cylinderGeometry args={[0.045, 0.045, 0.12, 10]} />
        </mesh>
        {/* 5-star base + casters */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <mesh position={[0.19, 0.06, 0]} rotation={[0, 0, -0.14]} material={mats.frame} castShadow>
                <boxGeometry args={[0.34, 0.045, 0.07]} />
              </mesh>
              <mesh position={[0.36, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.frame}>
                <cylinderGeometry args={[0.035, 0.035, 0.03, 10]} />
              </mesh>
            </group>
          );
        })}
        {/* seat + back + spine + arms */}
        <mesh position={[0, 0.47, 0]} material={mats.soft} castShadow>
          <boxGeometry args={[0.52, 0.1, 0.5]} />
        </mesh>
        <mesh position={[0, 0.96, 0.245]} rotation={[-0.14, 0, 0]} material={mats.soft} castShadow>
          <boxGeometry args={[0.5, 0.68, 0.09]} />
        </mesh>
        <mesh position={[0, 0.62, 0.26]} material={mats.frame}>
          <boxGeometry args={[0.06, 0.38, 0.04]} />
        </mesh>
        {[-0.3, 0.3].map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.57, 0]} material={mats.frame}>
              <boxGeometry args={[0.05, 0.22, 0.05]} />
            </mesh>
            <mesh position={[x, 0.68, 0]} material={mats.soft}>
              <boxGeometry args={[0.26, 0.03, 0.09]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---------- server racks ---------- */}
      {RACKS.map((rack, i) => (
        <group key={i} position={rack.pos} rotation={[0, rack.yaw, 0]}>
          <mesh material={mats.body} castShadow receiveShadow>
            <boxGeometry args={[0.6, 2.2, 0.7]} />
          </mesh>
          <mesh position={[0, 0, 0.34]} material={mats.frame}>
            <boxGeometry args={[0.5, 2.0, 0.02]} />
          </mesh>
          {Array.from({ length: 9 }, (_, b) => (
            <mesh key={b} position={[0, -0.85 + b * 0.21, 0.36]} material={b % 2 ? mats.body : mats.frame}>
              <boxGeometry args={[0.5, 0.11, 0.04]} />
            </mesh>
          ))}
        </group>
      ))}
      <RackLeds />

      {/* ---------- cable runs ---------- */}
      {CABLES.map((c, i) => (
        <mesh key={i} geometry={cableGeos[i]} material={c.emissive ? mats.emissiveSoft : mats.cable} />
      ))}

      {/* ---------- ceiling raft + emissive cove strips ---------- */}
      <mesh position={[0, 3.42, 0]} material={mats.body}>
        <boxGeometry args={[11.5, 0.12, 7.5]} />
      </mesh>
      {[
        [0, 3.49, -3.72, 11.5, 0.06],
        [0, 3.49, 3.72, 11.5, 0.06],
      ].map(([x, y, z, w], i) => (
        <mesh key={`ls-${i}`} position={[x, y, z]} material={mats.emissive}>
          <boxGeometry args={[w, 0.02, 0.06]} />
        </mesh>
      ))}
      {[
        [-5.72, 3.49, 0, 0.06, 7.5],
        [5.72, 3.49, 0, 0.06, 7.5],
      ].map(([x, y, z, , d], i) => (
        <mesh key={`lsv-${i}`} position={[x, y, z]} material={mats.emissive}>
          <boxGeometry args={[0.06, 0.02, d]} />
        </mesh>
      ))}
      {/* ceiling beams */}
      {[-2.5, 0.5, 3.5].map((z, i) => (
        <mesh key={`beam-${i}`} position={[0, 3.52, z]} material={mats.frame}>
          <boxGeometry args={[ROOM_HALF_X * 2, 0.14, 0.12]} />
        </mesh>
      ))}

      {/* ---------- wall panel insets ---------- */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh
          key={`pll-${i}`}
          position={[-ROOM_HALF_X + 0.03, 1.35, -4.2 + i * 1.4]}
          rotation={[0, Math.PI / 2, 0]}
          material={mats.body}
          receiveShadow
        >
          <boxGeometry args={[1.15, 2.4, 0.025]} />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh
          key={`plb-${i}`}
          position={[-6.2 + i * 1.4, 1.35, ROOM_HALF_Z - 0.03]}
          rotation={[0, Math.PI, 0]}
          material={mats.body}
          receiveShadow
        >
          <boxGeometry args={[1.15, 2.4, 0.025]} />
        </mesh>
      ))}

      {/* ---------- skirting light strips ---------- */}
      {[
        [0, 0.04, -ROOM_HALF_Z + 0.02, ROOM_HALF_X * 2 - 0.1, 0.015, 0.02, 0],
        [0, 0.04, ROOM_HALF_Z - 0.02, ROOM_HALF_X * 2 - 0.1, 0.015, 0.02, 0],
        [-ROOM_HALF_X + 0.02, 0.04, 0, 0.02, 0.015, ROOM_HALF_Z * 2 - 0.1, 0],
        [ROOM_HALF_X - 0.02, 0.04, 0, 0.02, 0.015, ROOM_HALF_Z * 2 - 0.1, 0],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`sk-${i}`} position={[x, y, z]} material={mats.emissiveSoft}>
          <boxGeometry args={[w, h, d]} />
        </mesh>
      ))}

      {/* ---------- personal desk dressing ---------- */}
      <group position={[-5.55, 0.9, 3.15]} rotation={[0, Math.PI * 0.75, 0]}>
        {/* mug + coffee */}
        <mesh position={[0.25, 0.05, 0.1]} material={mats.mug} castShadow>
          <cylinderGeometry args={[0.045, 0.042, 0.1, 14]} />
        </mesh>
        <mesh position={[0.25, 0.075, 0.1]} material={mats.coffee}>
          <circleGeometry args={[0.038, 14]} />
        </mesh>
        <mesh position={[0.3, 0.05, 0.1]} rotation={[0, 0, Math.PI / 2]} material={mats.mug}>
          <torusGeometry args={[0.035, 0.008, 8, 14]} />
        </mesh>
        {/* notebook + pen */}
        <mesh position={[-0.15, 0.012, 0.05]} rotation={[0, 0.15, 0]} material={mats.body} castShadow>
          <boxGeometry args={[0.15, 0.018, 0.21]} />
        </mesh>
        <mesh position={[-0.02, 0.006, 0.12]} rotation={[Math.PI / 2, 0, 0.5]} material={mats.frame}>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 8]} />
        </mesh>
        {/* loose papers */}
        {[-0.14, 0.07, 0.26].map((yaw, i) => (
          <mesh
            key={i}
            position={[0.02 + i * 0.02, 0.002 + i * 0.002, -0.1]}
            rotation={[-Math.PI / 2, 0, yaw]}
            material={mats.paper}
          >
            <planeGeometry args={[0.21, 0.297]} />
          </mesh>
        ))}
        {/* warm desk lamp head */}
        <mesh position={[-0.35, 0.25, -0.15]} material={mats.frame}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
        </mesh>
        <mesh position={[-0.28, 0.48, -0.08]} rotation={[0.5, 0, 0.4]} material={mats.emissiveSoft}>
          <cylinderGeometry args={[0.05, 0.07, 0.09, 10]} />
        </mesh>
      </group>

      {/* rotated brushed texture cue on the plotter is handled by its own material */}
    </group>
  );
}

export const CEILING_RAFT_Y = 3.42;

// mullion coordinate reference for the fresnel glass (kept for tuning)
export const GLASS_Z = Z_FRONT + 0.03;
