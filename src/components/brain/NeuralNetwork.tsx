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
      {/* Deep streaming starfield — creates 3D depth */}
      <Starfield entered={entered} />
      <group ref={brainGroupRef}>
        <Nodes graph={graph} mouse={mouse} entered={entered} activeHub={activeHub} livePositions={livePositions} />
        <Edges graph={graph} mouse={mouse} entered={entered} activeHub={activeHub} livePositions={livePositions} />
      </group>
    </group>
  );
}

// ========================= DEEP SPACE — STREAMING STARFIELD =========================

// Stars stream slowly toward camera, creating real 3D depth perception.
// When a star passes the camera it respawns far away. Brightness and size
// increase as stars approach — this is what makes it feel 3D, not color.

const starVertShader = `
  attribute float aSize;
  attribute float aBrightness;
  attribute vec3 aColor;
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    vBrightness = aBrightness;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragShader = `
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    // Tight bright core + soft wide halo = realistic star
    float core = smoothstep(0.08, 0.0, d);
    float inner = exp(-d * d * 20.0) * 0.7;
    float outer = exp(-d * d * 3.0) * 0.12;
    float intensity = (core + inner + outer) * vBrightness;
    gl_FragColor = vec4(vColor * intensity, intensity);
  }
`;

function Starfield({ entered }: { entered: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 2500;
  const Z_FAR = -100;
  const Z_NEAR = 3;
  const DRIFT_SPEED = 0.12; // units per second — perceptible cosmic drift

  const enteredTime = useRef<number | null>(null);
  const wasEntered = useRef(false);
  const lastTime = useRef(0);

  // Per-star base data (immutable)
  const starData = useMemo(() => {
    const baseX = new Float32Array(COUNT);
    const baseY = new Float32Array(COUNT);
    const baseSize = new Float32Array(COUNT);
    const baseBr = new Float32Array(COUNT);
    const twinklePhase = new Float32Array(COUNT);
    const twinkleSpeed = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      baseX[i] = (Math.random() - 0.5) * 80;
      baseY[i] = (Math.random() - 0.5) * 50;
      // Power-law size: many tiny, few large
      const r = Math.random();
      baseSize[i] = r < 0.80 ? 0.12 + Math.random() * 0.35
        : r < 0.95 ? 0.5 + Math.random() * 1.0
        : 1.5 + Math.random() * 2.5;
      baseBr[i] = baseSize[i] < 0.5 ? 0.10 + Math.random() * 0.15
        : baseSize[i] < 1.2 ? 0.18 + Math.random() * 0.25
        : 0.35 + Math.random() * 0.5;
      twinklePhase[i] = Math.random() * Math.PI * 2;
      twinkleSpeed[i] = 0.3 + Math.random() * 0.8;
    }
    return { baseX, baseY, baseSize, baseBr, twinklePhase, twinkleSpeed };
  }, []);

  // Geometry with live attributes
  const { geometry, colors } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    const br = new Float32Array(COUNT);
    const col = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = starData.baseX[i];
      pos[i * 3 + 1] = starData.baseY[i];
      // Distribute evenly across z range
      pos[i * 3 + 2] = Z_FAR + Math.random() * (Z_NEAR - Z_FAR);
      sz[i] = starData.baseSize[i];
      br[i] = 0;

      // Color temperature — most white, some warm, some blue
      const temp = Math.random();
      if (temp < 0.15) {
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.88; col[i * 3 + 2] = 0.7;
      } else if (temp < 0.7) {
        col[i * 3] = 0.95; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 1.0;
      } else {
        col[i * 3] = 0.75; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 1.0;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(br, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    return { geometry: geo, colors: col };
  }, [starData, Z_FAR, Z_NEAR]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const dt = t - lastTime.current;
    lastTime.current = t;

    if (entered && !wasEntered.current) {
      enteredTime.current = t;
      wasEntered.current = true;
    }

    const elapsed = enteredTime.current !== null ? t - enteredTime.current : -1;
    const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const brAttr = pointsRef.current.geometry.getAttribute("aBrightness") as THREE.BufferAttribute;
    const szAttr = pointsRef.current.geometry.getAttribute("aSize") as THREE.BufferAttribute;

    for (let i = 0; i < COUNT; i++) {
      let z = posAttr.getZ(i);

      // Stream toward camera
      if (elapsed > 0) {
        z += DRIFT_SPEED * dt * (1 + starData.baseSize[i] * 0.5);
      }

      // Recycle: when past camera, respawn far away
      if (z > Z_NEAR) {
        z = Z_FAR + Math.random() * 15;
        posAttr.setX(i, (Math.random() - 0.5) * 80);
        posAttr.setY(i, (Math.random() - 0.5) * 50);
      }
      posAttr.setZ(i, z);

      // Depth-based brightness: exponential ramp — dramatic depth
      const zNorm = (z - Z_FAR) / (Z_NEAR - Z_FAR); // 0=far, 1=near
      const depthBr = 0.08 + zNorm * zNorm * 0.92; // quadratic = dramatic near/far contrast
      const depthSz = 0.2 + zNorm * 0.8;

      // Entrance fade
      let entrance = 0;
      if (elapsed >= 0) {
        const hash = Math.sin(i * 311.7 + 127.1) * 43758.5453;
        const delay = 1.0 + (hash - Math.floor(hash)) * 5.0;
        const raw = Math.max(0, Math.min(1, (elapsed - delay) / 2.0));
        entrance = raw * raw;
      }

      // Twinkle
      const twinkle = 1.0 + 0.15 *
        Math.sin(t * starData.twinkleSpeed[i] + starData.twinklePhase[i]) *
        Math.sin(t * starData.twinkleSpeed[i] * 1.7 + starData.twinklePhase[i] * 0.7);

      brAttr.setX(i, starData.baseBr[i] * depthBr * twinkle * entrance);
      szAttr.setX(i, starData.baseSize[i] * depthSz * entrance);
    }

    posAttr.needsUpdate = true;
    brAttr.needsUpdate = true;
    szAttr.needsUpdate = true;
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

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// Dust particles removed — starfield handles all atmosphere now

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
