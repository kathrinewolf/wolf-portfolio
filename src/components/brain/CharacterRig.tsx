"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { WalkState } from "@/hooks/useRoomWalk";

// First-person body: you ARE the person. The rig hangs beneath the
// camera — look down and you see your own chest, arms and legs striding
// (FP-game grammar). Nothing renders above y≈1.28 so the view stays
// clear when looking level.

const SUIT = 0x252a38;
const SUIT_DARK = 0x1a1e2a;
const SHOE = 0xd8dde8;

interface Joints {
  root: THREE.Group | null;
  hipL: THREE.Group | null;
  hipR: THREE.Group | null;
  kneeL: THREE.Group | null;
  kneeR: THREE.Group | null;
  armL: THREE.Group | null;
  armR: THREE.Group | null;
}

export function FirstPersonBody({ walk }: { walk: WalkState }) {
  const joints = useRef<Joints>({
    root: null,
    hipL: null,
    hipR: null,
    kneeL: null,
    kneeR: null,
    armL: null,
    armR: null,
  });

  const mats = useMemo(
    () => ({
      suit: new THREE.MeshStandardMaterial({
        color: SUIT,
        roughness: 0.6,
        metalness: 0.2,
        envMapIntensity: 0.5,
      }),
      suitDark: new THREE.MeshStandardMaterial({
        color: SUIT_DARK,
        roughness: 0.7,
        metalness: 0.15,
      }),
      shoe: new THREE.MeshStandardMaterial({
        color: SHOE,
        roughness: 0.55,
        metalness: 0,
      }),
    }),
    []
  );

  const geos = useMemo(
    () => ({
      chest: new RoundedBoxGeometry(0.34, 0.22, 0.2, 2, 0.05),
      pelvis: new RoundedBoxGeometry(0.3, 0.18, 0.18, 2, 0.04),
      thigh: new RoundedBoxGeometry(0.12, 0.44, 0.14, 1, 0.035),
      shin: new RoundedBoxGeometry(0.1, 0.42, 0.12, 1, 0.03),
      foot: new RoundedBoxGeometry(0.1, 0.07, 0.26, 1, 0.02),
      upperArm: new RoundedBoxGeometry(0.09, 0.3, 0.1, 1, 0.025),
      forearm: new RoundedBoxGeometry(0.08, 0.28, 0.09, 1, 0.02),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
      Object.values(geos).forEach((g) => g.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state) => {
    const j = joints.current;
    if (!j.root) return;
    const t = state.clock.elapsedTime;
    const p = walk.walkPhase;
    const s = walk.speed01;

    // the body rides slightly AHEAD of the camera so looking down at a
    // natural angle shows your legs striding into view (FP-game grammar)
    const fx = -Math.sin(walk.yaw);
    const fz = -Math.cos(walk.yaw);
    const lead = 0.14 + 0.06 * s;
    j.root.position.set(walk.pos.x + fx * lead, 0, walk.pos.z + fz * lead);
    j.root.rotation.y = walk.yaw;
    // forward lean while moving pushes the legs further into frame
    j.root.rotation.x = 0.11 * s;

    // asymmetric stride: strong forward kick, knees lift into view
    const swing = 0.8 * s;
    const kickL = Math.sin(p);
    const kickR = Math.sin(p + Math.PI);
    if (j.hipL) j.hipL.rotation.x = (kickL > 0 ? kickL * 1.15 : kickL * 0.7) * swing - 0.06 * s;
    if (j.hipR) j.hipR.rotation.x = (kickR > 0 ? kickR * 1.15 : kickR * 0.7) * swing - 0.06 * s;
    if (j.kneeL) j.kneeL.rotation.x = Math.max(0, -Math.sin(p - 0.55)) * 1.0 * s;
    if (j.kneeR) j.kneeR.rotation.x = Math.max(0, -Math.sin(p + Math.PI - 0.55)) * 1.0 * s;
    if (j.armL) j.armL.rotation.x = Math.sin(p + Math.PI) * 0.55 * s + Math.sin(t * 1.2) * 0.015;
    if (j.armR) j.armR.rotation.x = Math.sin(p) * 0.55 * s + Math.sin(t * 1.2 + 1.4) * 0.015;
  });

  const set =
    (key: keyof Joints) =>
    (el: THREE.Group | null): void => {
      joints.current[key] = el;
    };

  return (
    <group ref={set("root")}>
      {/* chest stub: gives the "my body" read when looking straight down */}
      <mesh geometry={geos.chest} position={[0, 1.17, 0.01]} material={mats.suit} />
      <mesh geometry={geos.pelvis} position={[0, 0.95, 0]} material={mats.suitDark} />

      {/* arms hang at the sides, counter-swing while walking */}
      <group ref={set("armL")} position={[-0.24, 1.24, 0]}>
        <mesh geometry={geos.upperArm} position={[0, -0.15, 0]} material={mats.suit} />
        <mesh geometry={geos.forearm} position={[0, -0.42, 0.015]} material={mats.suitDark} />
      </group>
      <group ref={set("armR")} position={[0.24, 1.24, 0]}>
        <mesh geometry={geos.upperArm} position={[0, -0.15, 0]} material={mats.suit} />
        <mesh geometry={geos.forearm} position={[0, -0.42, 0.015]} material={mats.suitDark} />
      </group>

      {/* legs */}
      <group ref={set("hipL")} position={[-0.095, 0.9, 0]}>
        <mesh geometry={geos.thigh} position={[0, -0.22, 0]} material={mats.suit} castShadow />
        <group ref={set("kneeL")} position={[0, -0.44, 0]}>
          <mesh geometry={geos.shin} position={[0, -0.21, 0]} material={mats.suitDark} castShadow />
          <mesh geometry={geos.foot} position={[0, -0.43, 0.06]} material={mats.shoe} castShadow />
        </group>
      </group>
      <group ref={set("hipR")} position={[0.095, 0.9, 0]}>
        <mesh geometry={geos.thigh} position={[0, -0.22, 0]} material={mats.suit} castShadow />
        <group ref={set("kneeR")} position={[0, -0.44, 0]}>
          <mesh geometry={geos.shin} position={[0, -0.21, 0]} material={mats.suitDark} castShadow />
          <mesh geometry={geos.foot} position={[0, -0.43, 0.06]} material={mats.shoe} castShadow />
        </group>
      </group>
    </group>
  );
}
