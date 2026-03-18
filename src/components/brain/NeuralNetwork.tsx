"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateGraph, type NeuralGraph, type NeuralNode } from "@/lib/neural-graph";

interface NeuralNetworkProps {
  onHubClick: (contentKey: string) => void;
  activeHub: string | null;
  entered: boolean;
  zoomTarget: [number, number, number] | null;
  onZoomComplete?: () => void;
  onZoomOutComplete?: () => void;
  brainRotationRef?: React.RefObject<{ x: number; y: number }>;
}

export function NeuralNetwork({
  onHubClick,
  activeHub,
  entered,
  zoomTarget,
  onZoomComplete,
  onZoomOutComplete,
  brainRotationRef,
}: NeuralNetworkProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{
        width: "100%",
        height: "100%",
        opacity: entered ? 1 : 0,
        transition: "opacity 1.5s ease",
      }}
    >
      <NeuralScene
        onHubClick={onHubClick}
        activeHub={activeHub}
        entered={entered}
        zoomTarget={zoomTarget}
        onZoomComplete={onZoomComplete}
        onZoomOutComplete={onZoomOutComplete}
        brainRotationRef={brainRotationRef}
      />
    </Canvas>
  );
}

function noise(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 1.3 + t * 0.3) * 0.5 +
    Math.cos(y * 1.7 + t * 0.2) * 0.5 +
    Math.sin((x + y) * 0.9 + t * 0.35) * 0.3
  );
}

// Responsive camera config
function getMobileConfig() {
  if (typeof window === "undefined") return { z: 8, fov: 50, isMobile: false };
  const aspect = window.innerWidth / window.innerHeight;
  const isMobile = aspect < 1;
  return {
    z: isMobile ? 14.5 : 8,
    fov: isMobile ? 65 : 50,  // wider FOV on mobile = brain stays large
    isMobile,
  };
}

const DEFAULT_CAM_POS = new THREE.Vector3(0, 0, 8);

function NeuralScene({
  onHubClick,
  activeHub,
  entered,
  zoomTarget,
  onZoomComplete,
  onZoomOutComplete,
  brainRotationRef,
}: NeuralNetworkProps) {
  const graph = useMemo(() => generateGraph(42), []);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const { camera, size } = useThree();

  const mobileConfig = useMemo(() => getMobileConfig(), []);
  const defaultCamPos = useMemo(() => new THREE.Vector3(0, 0, mobileConfig.z), [mobileConfig]);
  const camTarget = useRef(new THREE.Vector3(0, 0, mobileConfig.z));
  const camLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Set camera position + FOV immediately on mount
  useEffect(() => {
    camera.position.set(0, 0, mobileConfig.z);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = mobileConfig.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, mobileConfig]);
  const zoomCompleteFired = useRef(false);
  const zoomOutCompleteFired = useRef(false);
  const isZoomedIn = useRef(false);

  useEffect(() => {
    if (zoomTarget) {
      const hubPos = new THREE.Vector3(...zoomTarget);
      const dir = hubPos.clone().sub(defaultCamPos).normalize();
      const targetPos = hubPos.clone().sub(dir.multiplyScalar(2));
      camTarget.current.copy(targetPos);
      targetLookAt.current.copy(hubPos);
      zoomCompleteFired.current = false;
      isZoomedIn.current = true;
      zoomOutCompleteFired.current = false;
    } else {
      camTarget.current.copy(defaultCamPos);
      targetLookAt.current.set(0, 0, 0);
      zoomCompleteFired.current = false;
      if (isZoomedIn.current) {
        zoomOutCompleteFired.current = false;
        isZoomedIn.current = false;
      }
    }
  }, [zoomTarget, defaultCamPos]);

  useFrame(() => {
    // Faster lerp when zooming out to avoid long wait
    const isZoomingOut = !zoomTarget && camera.position.distanceTo(defaultCamPos) > 0.5;
    const lerpSpeed = isZoomingOut ? 0.06 : 0.035;
    camera.position.lerp(camTarget.current, lerpSpeed);
    camLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    camera.lookAt(camLookAt.current);

    if (zoomTarget && !zoomCompleteFired.current && camera.position.distanceTo(camTarget.current) < 0.15) {
      zoomCompleteFired.current = true;
      onZoomComplete?.();
    }
    if (!zoomTarget && !zoomOutCompleteFired.current && !isZoomedIn.current && camera.position.distanceTo(defaultCamPos) < 0.5) {
      zoomOutCompleteFired.current = true;
      onZoomOutComplete?.();
    }
  });

  const onPointerMove = useCallback(
    (e: { clientX: number; clientY: number }) => {
      mouse.current.x = (e.clientX / size.width) * 2 - 1;
      mouse.current.y = -(e.clientY / size.height) * 2 + 1;
    },
    [size]
  );

  const livePositions = useRef(new Float32Array(graph.nodes.length * 3));
  const brainGroupRef = useRef<THREE.Group>(null);

  // Very slow, meditative rotation — barely perceptible but adds life
  useFrame(({ clock }) => {
    if (!brainGroupRef.current || zoomTarget) return;
    const t = clock.getElapsedTime();
    const ry = Math.sin(t * 0.05) * 0.1;
    const rx = Math.sin(t * 0.035 + 1.0) * 0.03;
    brainGroupRef.current.rotation.y = ry;
    brainGroupRef.current.rotation.x = rx;
    // Expose rotation for label tracking
    if (brainRotationRef?.current) {
      brainRotationRef.current.x = rx;
      brainRotationRef.current.y = ry;
    }
  });

  return (
    <group onPointerMove={onPointerMove}>
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[20, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* Deep starfield background */}
      <Starfield entered={entered} />
      {/* Floating dust particles */}
      <DustParticles entered={entered} />
      <group ref={brainGroupRef}>
        <Nodes graph={graph} mouse={mouse} entered={entered} activeHub={activeHub} livePositions={livePositions} />
        <Edges graph={graph} mouse={mouse} entered={entered} activeHub={activeHub} livePositions={livePositions} />
      </group>
    </group>
  );
}

// ========================= STARFIELD =========================

const starVertShader = `
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  void main() {
    vBrightness = aBrightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragShader = `
  varying float vBrightness;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    // Tight core with soft halo
    float core = smoothstep(0.15, 0.0, d) * 0.8;
    float halo = exp(-d * d * 12.0) * 0.4;
    float alpha = (core + halo) * vBrightness;
    // Cool white with very subtle blue shift
    vec3 color = vec3(0.85, 0.88, 1.0) * (core + halo) * vBrightness;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Starfield({ entered }: { entered: boolean }) {
  const count = 300;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes, brightnesses, baseBrightnesses, twinklePhases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const br = new Float32Array(count);
    const bbr = new Float32Array(count);
    const tp = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across a wide dome behind the brain
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.8; // hemisphere
      const r = 12 + Math.random() * 20; // far behind

      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.6; // compress vertically
      pos[i * 3 + 2] = -Math.abs(Math.cos(phi) * r) - 3; // always behind brain

      // Most stars tiny, a few larger
      const isBright = Math.random() > 0.92;
      sz[i] = isBright ? 1.2 + Math.random() * 1.5 : 0.3 + Math.random() * 0.7;
      const b = isBright ? 0.4 + Math.random() * 0.4 : 0.08 + Math.random() * 0.15;
      br[i] = b;
      bbr[i] = b;
      tp[i] = Math.random() * Math.PI * 2; // random twinkle phase
    }

    return { positions: pos, sizes: sz, brightnesses: br, baseBrightnesses: bbr, twinklePhases: tp };
  }, []);

  // Slow entrance + gentle twinkle
  const enteredTime = useRef<number | null>(null);
  const wasEntered = useRef(false);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();

    if (entered && !wasEntered.current) {
      enteredTime.current = t;
      wasEntered.current = true;
    }

    const brAttr = pointsRef.current.geometry.getAttribute("aBrightness") as THREE.BufferAttribute;
    const elapsed = enteredTime.current !== null ? t - enteredTime.current : -1;

    for (let i = 0; i < count; i++) {
      // Slow fade-in over 3-8 seconds (staggered by index hash)
      let entrance = 0;
      if (elapsed >= 0) {
        const hash = Math.sin(i * 311.7 + 127.1) * 43758.5453;
        const delay = 2.0 + (hash - Math.floor(hash)) * 6.0;
        const raw = Math.max(0, Math.min(1, (elapsed - delay) / 1.5));
        entrance = raw * raw; // ease-in for stars — they emerge gradually
      }

      // Gentle twinkle — slow, subtle
      const twinkle = 1.0 + 0.15 * Math.sin(t * 0.3 + twinklePhases[i]) *
        Math.sin(t * 0.7 + twinklePhases[i] * 2.3);

      brAttr.setX(i, baseBrightnesses[i] * twinkle * entrance);
    }
    brAttr.needsUpdate = true;
  });

  const material = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: starVertShader,
      fragmentShader: starFragShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightnesses, 1));
    return geo;
  }, [positions, sizes, brightnesses]);

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// ========================= ATMOSPHERE =========================

// Floating dust particles — tiny, slow, atmospheric
const dustVertShader = `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dustFragShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(0.65, 0.72, 0.95, alpha * 0.12);
  }
`;

function DustParticles({ entered }: { entered: boolean }) {
  const count = 60;
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, sizes, alphas } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const al = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      sz[i] = 0.3 + Math.random() * 0.6;
      al[i] = 0.15 + Math.random() * 0.3;
    }
    return { positions: pos, sizes: sz, alphas: al };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !entered) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      // Very slow drift
      const baseX = (Math.sin(i * 127.1) * 43758.5453 % 1) * 14 - 7;
      const baseY = (Math.sin(i * 269.5) * 43758.5453 % 1) * 10 - 5;
      const baseZ = (Math.sin(i * 419.2) * 43758.5453 % 1) * 4 - 2;
      posAttr.setXYZ(i,
        baseX + Math.sin(t * 0.03 + i * 0.5) * 0.3,
        baseY + Math.cos(t * 0.02 + i * 0.7) * 0.2,
        baseZ + Math.sin(t * 0.015 + i) * 0.15
      );
    }
    posAttr.needsUpdate = true;
  });

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: dustVertShader,
    fragmentShader: dustFragShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return g;
  }, [positions, sizes, alphas]);

  return entered ? <points ref={pointsRef} geometry={geo} material={mat} /> : null;
}

// ========================= NODES =========================

const nodeVertexShader = `
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  void main() {
    vBrightness = aBrightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const nodeFragmentShader = `
  varying float vBrightness;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    // Wider, softer glow radius
    float glow = exp(-d * d * 5.0) * vBrightness;
    float core = smoothstep(0.08, 0.0, d) * vBrightness * 0.6;
    float alpha = glow + core;
    // Subtle blue-white tint — cooler, more premium
    vec3 coolWhite = vec3(0.75, 0.82, 1.0);
    vec3 color = coolWhite * (glow + core);
    gl_FragColor = vec4(color, alpha * 0.95);
  }
`;

function Nodes({
  graph, mouse, entered, activeHub, livePositions,
}: {
  graph: NeuralGraph;
  mouse: React.RefObject<THREE.Vector2>;
  entered: boolean;
  activeHub: string | null;
  livePositions: React.RefObject<Float32Array>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = graph.nodes.length;
  const mouseWorld = useRef(new THREE.Vector3());

  const enteredTime = useRef<number | null>(null);
  const wasEntered = useRef(false);

  const { positions, sizes, brightnesses, baseSizes, baseBrightnesses } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const br = new Float32Array(count);
    const bsz = new Float32Array(count);
    const bbr = new Float32Array(count);

    graph.nodes.forEach((node, i) => {
      pos[i * 3] = node.position[0];
      pos[i * 3 + 1] = node.position[1];
      pos[i * 3 + 2] = node.position[2];

      // Hub dots prominent, boundary nodes fade to nothing
      const s = node.type === "hub" ? 6 : 1 + node.size * 5;
      sz[i] = s; bsz[i] = s;

      // Boundary fade — nodes near the brain edge are dimmer
      const edgeFade = node.type === "hub" ? 1.0 :
        Math.min(1, 0.3 + node.size * 12); // smaller nodes (boundary) = dimmer
      const b = node.type === "hub" ? 0.5 : 0.1 * edgeFade;
      br[i] = b; bbr[i] = b;
    });

    return { positions: pos, sizes: sz, brightnesses: br, baseSizes: bsz, baseBrightnesses: bbr };
  }, [graph, count]);

  // Pre-compute hub positions for distance calculations
  const hubPositions = useMemo(() =>
    graph.nodes.filter(n => n.type === "hub").map(n => n.position),
    [graph]
  );

  const nodeDelays = useMemo(() => {
    const delays = new Float32Array(count);
    const fadeDurations = new Float32Array(count);

    // Hub timing: 0.0, 1.0, 2.0, 3.0, 4.0 — each hub clearly individual
    const hubDelayMap = new Map<string, number>();
    let hubIdx = 0;
    for (let i = 0; i < count; i++) {
      const node = graph.nodes[i];
      if (node.type === "hub") {
        delays[i] = hubIdx * 1.0;
        fadeDurations[i] = 0.7;
        hubDelayMap.set(node.id, hubIdx * 1.0);
        hubIdx++;
      }
    }

    // Ambient nodes: each appears near its closest hub's timing
    // Nodes near hub 0 start appearing shortly after hub 0, etc.
    // This creates the "thought expanding from each dot" effect
    for (let i = 0; i < count; i++) {
      const node = graph.nodes[i];
      if (node.type === "hub") continue;

      // Find nearest hub and its delay
      let nearestHubDelay = 2.0;
      let nearestHubDist = Infinity;
      for (const hp of hubPositions) {
        const idx2 = hubPositions.indexOf(hp);
        const d = Math.sqrt(
          (node.position[0] - hp[0]) ** 2 +
          (node.position[1] - hp[1]) ** 2
        );
        if (d < nearestHubDist) {
          nearestHubDist = d;
          nearestHubDelay = idx2 * 1.0;
        }
      }

      // Appear after nearest hub, with distance-based spread + randomness
      const hash = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const jitter = (hash - Math.floor(hash)) * 0.8;
      delays[i] = nearestHubDelay + 0.6 + (nearestHubDist / 3.5) * 1.2 + jitter;
      fadeDurations[i] = 0.4 + (hash * 7 - Math.floor(hash * 7)) * 0.3;
    }

    return { delays, fadeDurations };
  }, [graph, count, hubPositions]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();

    if (entered && !wasEntered.current) {
      enteredTime.current = t;
      wasEntered.current = true;
    }

    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const szAttr = geo.getAttribute("aSize") as THREE.BufferAttribute;
    const brAttr = geo.getAttribute("aBrightness") as THREE.BufferAttribute;

    const elapsed = enteredTime.current !== null ? t - enteredTime.current : -1;

    const mw = mouseWorld.current;
    mw.set(mouse.current!.x * 5.5, mouse.current!.y * 3.5, 0);

    const livePos = livePositions.current!;

    for (let i = 0; i < count; i++) {
      const node = graph.nodes[i];
      const drift = 0.02;
      const dx = noise(node.position[0], node.position[1], t) * drift;
      const dy = noise(node.position[1], node.position[0], t + 100) * drift;
      const dz = noise(node.position[2], node.position[0], t + 200) * drift * 0.3;

      const px = node.position[0] + dx;
      const py = node.position[1] + dy;
      const pz = node.position[2] + dz;

      posAttr.setXYZ(i, px, py, pz);
      livePos[i * 3] = px;
      livePos[i * 3 + 1] = py;
      livePos[i * 3 + 2] = pz;

      // Depth-based dimming — nodes further back (higher z) are dimmer
      const depthFade = 0.6 + 0.4 * ((pz + 1.0) / 2.0); // z ranges ~-1 to 1, maps to 0.4-1.0

      // Mouse proximity glow
      const dist = Math.sqrt((px - mw.x) ** 2 + (py - mw.y) ** 2);
      const proximity = Math.max(0, 1 - dist / 2.0);

      const targetBr = (baseBrightnesses[i] + proximity * 0.10) * depthFade;
      const targetSz = (baseSizes[i] + proximity * 0.5) * (0.8 + 0.2 * depthFade);
      const dimFactor = activeHub ? 0.2 : 1;

      let easedEntrance = 0;
      if (elapsed >= 0) {
        const delay = nodeDelays.delays[i];
        const fadeDur = nodeDelays.fadeDurations[i];
        const raw = Math.max(0, Math.min(1, (elapsed - delay) / fadeDur));
        easedEntrance = 1 - Math.pow(1 - raw, 3);
      }

      brAttr.setX(i, targetBr * dimFactor * easedEntrance);
      szAttr.setX(i, targetSz * easedEntrance);
    }

    posAttr.needsUpdate = true;
    szAttr.needsUpdate = true;
    brAttr.needsUpdate = true;
  });

  const shaderMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightnesses, 1));
    return geo;
  }, [positions, sizes, brightnesses]);

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />;
}

// ========================= EDGES =========================

function Edges({
  graph, mouse, entered, activeHub, livePositions,
}: {
  graph: NeuralGraph;
  mouse: React.RefObject<THREE.Vector2>;
  entered: boolean;
  activeHub: string | null;
  livePositions: React.RefObject<Float32Array>;
}) {
  const lineRef = useRef<THREE.LineSegments>(null);
  const mouseWorld = useRef(new THREE.Vector3());

  const enteredTime = useRef<number | null>(null);
  const wasEntered = useRef(false);

  const { positions, colors, nodeMap, nodeIndexMap, edgeBaseOpacities } = useMemo(() => {
    const nMap = new Map<string, NeuralNode>();
    graph.nodes.forEach((n) => nMap.set(n.id, n));

    const nIdxMap = new Map<string, number>();
    graph.nodes.forEach((n, i) => nIdxMap.set(n.id, i));

    const hubPositions = graph.nodes.filter(n => n.type === "hub").map(n => n.position);

    const totalVerts = graph.edges.length * 2;
    const pos = new Float32Array(totalVerts * 3);
    const col = new Float32Array(totalVerts * 3);
    const baseOp = new Float32Array(graph.edges.length);

    graph.edges.forEach(([aId, bId], idx) => {
      const a = nMap.get(aId)!;
      const b = nMap.get(bId)!;

      const vi = idx * 2 * 3;
      pos[vi] = a.position[0]; pos[vi + 1] = a.position[1]; pos[vi + 2] = a.position[2];
      pos[vi + 3] = b.position[0]; pos[vi + 4] = b.position[1]; pos[vi + 5] = b.position[2];
      for (let c = 0; c < 6; c++) col[vi + c] = 0;

      // Brighter edges — hierarchy based on hub proximity
      const hasHub = a.type === "hub" || b.type === "hub";
      const mx = (a.position[0] + b.position[0]) / 2;
      const my = (a.position[1] + b.position[1]) / 2;
      let minHubDist = Infinity;
      for (const hp of hubPositions) {
        const d = Math.sqrt((mx - hp[0]) ** 2 + (my - hp[1]) ** 2);
        if (d < minHubDist) minHubDist = d;
      }
      // Random variation per edge — some bright, some barely-there whispers
      const edgeRand = Math.sin(idx * 347.1 + 571.3) * 43758.5453;
      const variation = 0.6 + (edgeRand - Math.floor(edgeRand)) * 0.4; // 0.6–1.0
      if (hasHub) baseOp[idx] = 0.22 * variation;
      else if (minHubDist < 1.5) baseOp[idx] = 0.14 * variation;
      else baseOp[idx] = 0.08 * variation;
    });

    return { positions: pos, colors: col, nodeMap: nMap, nodeIndexMap: nIdxMap, edgeBaseOpacities: baseOp };
  }, [graph]);

  // Edge delays: each edge appears shortly after both its endpoint nodes
  const edgeDelays = useMemo(() => {
    const delays = new Float32Array(graph.edges.length);
    const hubPositions = graph.nodes.filter(n => n.type === "hub").map(n => n.position);

    for (let i = 0; i < graph.edges.length; i++) {
      const [aId, bId] = graph.edges[i];
      const a = nodeMap.get(aId)!;
      const b = nodeMap.get(bId)!;

      // Edge midpoint — find nearest hub for timing context
      const mx = (a.position[0] + b.position[0]) / 2;
      const my = (a.position[1] + b.position[1]) / 2;
      let nearestHubIdx = 0;
      let minDist = Infinity;
      for (let h = 0; h < hubPositions.length; h++) {
        const d = Math.sqrt((mx - hubPositions[h][0]) ** 2 + (my - hubPositions[h][1]) ** 2);
        if (d < minDist) { minDist = d; nearestHubIdx = h; }
      }

      const hash = Math.sin(i * 73.1 + 191.3) * 43758.5453;
      const jitter = (hash - Math.floor(hash)) * 0.6;

      // Edge appears after its nearest hub's region has started populating
      const hubBase = nearestHubIdx * 1.0;
      const isHub = a.type === "hub" || b.type === "hub";
      delays[i] = hubBase + (isHub ? 0.8 : 1.2) + (minDist / 3.5) * 1.0 + jitter;
    }
    return delays;
  }, [graph, nodeMap]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const t = clock.getElapsedTime();

    if (entered && !wasEntered.current) {
      enteredTime.current = t;
      wasEntered.current = true;
    }

    const geo = lineRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = geo.getAttribute("color") as THREE.BufferAttribute;
    const elapsed = enteredTime.current !== null ? t - enteredTime.current : -1;

    const mw = mouseWorld.current;
    mw.set(mouse.current!.x * 5.5, mouse.current!.y * 3.5, 0);
    const dimFactor = activeHub ? 0.12 : 1;

    const livePos = livePositions.current!;
    const posArr = posAttr.array as Float32Array;

    for (let i = 0; i < graph.edges.length; i++) {
      const [aId, bId] = graph.edges[i];
      const aIdx = nodeIndexMap.get(aId)!;
      const bIdx = nodeIndexMap.get(bId)!;

      const vi = i * 2 * 3;
      posArr[vi] = livePos[aIdx * 3];
      posArr[vi + 1] = livePos[aIdx * 3 + 1];
      posArr[vi + 2] = livePos[aIdx * 3 + 2];
      posArr[vi + 3] = livePos[bIdx * 3];
      posArr[vi + 4] = livePos[bIdx * 3 + 1];
      posArr[vi + 5] = livePos[bIdx * 3 + 2];

      // Edge midpoint for proximity + depth
      const mx = (posArr[vi] + posArr[vi + 3]) / 2;
      const my = (posArr[vi + 1] + posArr[vi + 4]) / 2;
      const mz = (posArr[vi + 2] + posArr[vi + 5]) / 2;

      // Depth-based dimming — edges in the back fade out
      const depthFade = 0.5 + 0.5 * ((mz + 1.0) / 2.0);

      const dist = Math.sqrt((mx - mw.x) ** 2 + (my - mw.y) ** 2);
      const proximity = Math.max(0, 1 - dist / 2.5);

      const breath = 0.006 * Math.sin(t * 0.4 + i * 0.2);

      const base = (edgeBaseOpacities[i] + breath + proximity * 0.06) * depthFade;

      let easedEntrance = 0;
      if (elapsed >= 0) {
        const delay = edgeDelays[i];
        const raw = Math.max(0, Math.min(1, (elapsed - delay) / 0.5));
        easedEntrance = 1 - Math.pow(1 - raw, 2);
      }

      // Blue-white tint matching nodes
      const r = base * 0.75 * dimFactor * easedEntrance;
      const g = base * 0.82 * dimFactor * easedEntrance;
      const bv = base * 1.0 * dimFactor * easedEntrance;

      colAttr.setXYZ(i * 2, r, g, bv);
      colAttr.setXYZ(i * 2 + 1, r, g, bv);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  const edgeMaterial = useMemo(
    () => new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    []
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return <lineSegments ref={lineRef} geometry={geometry} material={edgeMaterial} />;
}
