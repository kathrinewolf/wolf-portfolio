import * as THREE from "three";

// Volumetric brain world + camera rail for the scroll-to-glide flythrough.
//
// The brain is a union of 6 lumpy ellipsoid lobes (~56 x 34 x 50 units)
// filled with a neural network the camera flies THROUGH. Five stations
// (the site's sections) are denser ganglia inside distinct lobes; a
// CatmullRom rail weaves between them in 3D.

// Seeded random for deterministic generation
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ========================= BRAIN VOLUME =========================

const LOBES = [
  { c: [0, 3, 14], r: [16, 12, 13] }, // frontal
  { c: [0, 8, 0], r: [17, 11, 14] }, // parietal dome
  { c: [-11, -4, 4], r: [9, 7, 14] }, // temporal L
  { c: [11, -4, 4], r: [9, 7, 14] }, // temporal R
  { c: [0, 2, -14], r: [14, 10, 11] }, // occipital
  { c: [0, -8, -12], r: [9, 6, 8] }, // cerebellum
] as const;

/** <= 0 inside the brain volume */
export function brainDistance3(x: number, y: number, z: number): number {
  let d = Infinity;
  for (const l of LOBES) {
    const e =
      ((x - l.c[0]) / l.r[0]) ** 2 +
      ((y - l.c[1]) / l.r[1]) ** 2 +
      ((z - l.c[2]) / l.r[2]) ** 2 -
      1;
    if (e < d) d = e;
  }
  // longitudinal fissure: dent the surface near the sagittal plane, top half
  if (y > 4) d += 0.18 * Math.exp(-(x * x) / 3.5);
  return d;
}

// ========================= REGIONS (stations) =========================

export interface RegionDefinition {
  id: string;
  /** two-digit tour number, e.g. "01" */
  number: string;
  label: string;
  contentKey: string;
  description: string;
  /** ganglion core in world space */
  position: THREE.Vector3;
  /** label anchor in world space */
  labelAnchor: THREE.Vector3;
  /** rail progress (0..1) of this station's flyby — filled by the rail build */
  progress: number;
}

// Tour order IS array order. Cores spread across lobes AND heights
// (6 → -2 → 4 → -3 → 11) so the rail must dive, bank and climb.
const REGION_DEFS = [
  { id: "region-playground", label: "Projects", contentKey: "playground", description: "AI agents & experiments", core: [0, 6, 16] },
  { id: "region-craft", label: "What I Do", contentKey: "craft", description: "Skills & approach", core: [12, -2, 5] },
  { id: "region-work", label: "Work Experience", contentKey: "work", description: "Professional timeline", core: [2, 4, -14] },
  { id: "region-who", label: "Who Is This Guy?", contentKey: "who-i-am", description: "The person behind the work", core: [-12, -3, 2] },
  { id: "region-connect", label: "Get In Touch", contentKey: "connect", description: "Let's talk", core: [0, 11, 2] },
];

export const REGIONS: RegionDefinition[] = REGION_DEFS.map((def, i) => ({
  id: def.id,
  number: `0${i + 1}`,
  label: def.label,
  contentKey: def.contentKey,
  description: def.description,
  position: new THREE.Vector3(def.core[0], def.core[1], def.core[2]),
  labelAnchor: new THREE.Vector3(def.core[0], def.core[1] + 2.2, def.core[2]),
  progress: 0, // filled below once the rail is sampled
}));

// ========================= THE RAIL =========================

const WAYPOINTS: [number, number, number][] = [
  [0, 1, 21], // entry — inside the frontal lobe, network already behind you
  [2.5, 5, 13.5], // 01 flyby
  [9, -1, 10], // dive right
  [9.5, -3, 3.5], // 02 flyby
  [7, 1, -8], // bank toward the back
  [4, 3, -12.5], // 03 flyby
  [-4, -2, -8], // cross low under the parietal dome
  [-10, -2.5, 0], // 04 flyby
  [-7, 4, 6], // climb
  [-2.5, 10, 3], // 05 flyby
  [0, 8, -2], // finale drift, looking back across the brain
];

export const RAIL_SAMPLES = 600;

export interface Rail {
  positions: Float32Array; // RAIL_SAMPLES * 3
  tangents: Float32Array; // RAIL_SAMPLES * 3
  rolls: Float32Array; // RAIL_SAMPLES
  count: number;
}

function buildRail(): Rail {
  const curve = new THREE.CatmullRomCurve3(
    WAYPOINTS.map((w) => new THREE.Vector3(w[0], w[1], w[2])),
    false,
    "centripetal",
    0.5
  );
  const positions = new Float32Array(RAIL_SAMPLES * 3);
  const tangents = new Float32Array(RAIL_SAMPLES * 3);
  const rolls = new Float32Array(RAIL_SAMPLES);

  const p = new THREE.Vector3();
  const t = new THREE.Vector3();
  for (let i = 0; i < RAIL_SAMPLES; i++) {
    const u = i / (RAIL_SAMPLES - 1);
    curve.getPointAt(u, p);
    curve.getTangentAt(u, t);
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    tangents[i * 3] = t.x;
    tangents[i * 3 + 1] = t.y;
    tangents[i * 3 + 2] = t.z;
  }

  // curvature roll (banking), smoothed over a small window
  const rawRoll = new Float32Array(RAIL_SAMPLES);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let i = 0; i < RAIL_SAMPLES - 1; i++) {
    a.set(tangents[i * 3], tangents[i * 3 + 1], tangents[i * 3 + 2]);
    b.set(tangents[(i + 1) * 3], tangents[(i + 1) * 3 + 1], tangents[(i + 1) * 3 + 2]);
    a.cross(b);
    rawRoll[i] = THREE.MathUtils.clamp(a.y * 40, -0.08, 0.08);
  }
  rawRoll[RAIL_SAMPLES - 1] = 0;
  for (let i = 0; i < RAIL_SAMPLES; i++) {
    let sum = 0;
    let n = 0;
    for (let k = -12; k <= 12; k++) {
      const j = i + k;
      if (j >= 0 && j < RAIL_SAMPLES) {
        sum += rawRoll[j];
        n++;
      }
    }
    rolls[i] = sum / n;
  }

  return { positions, tangents, rolls, count: RAIL_SAMPLES };
}

export const RAIL: Rail = buildRail();

/** interpolated rail pose at progress p (0..1); writes into out vectors */
export function sampleRail(
  p: number,
  outPos: THREE.Vector3,
  outTan: THREE.Vector3
): void {
  const f = THREE.MathUtils.clamp(p, 0, 1) * (RAIL_SAMPLES - 1);
  const i0 = Math.min(Math.floor(f), RAIL_SAMPLES - 2);
  const k = f - i0;
  const i1 = i0 + 1;
  outPos.set(
    RAIL.positions[i0 * 3] + (RAIL.positions[i1 * 3] - RAIL.positions[i0 * 3]) * k,
    RAIL.positions[i0 * 3 + 1] + (RAIL.positions[i1 * 3 + 1] - RAIL.positions[i0 * 3 + 1]) * k,
    RAIL.positions[i0 * 3 + 2] + (RAIL.positions[i1 * 3 + 2] - RAIL.positions[i0 * 3 + 2]) * k
  );
  outTan
    .set(
      RAIL.tangents[i0 * 3] + (RAIL.tangents[i1 * 3] - RAIL.tangents[i0 * 3]) * k,
      RAIL.tangents[i0 * 3 + 1] + (RAIL.tangents[i1 * 3 + 1] - RAIL.tangents[i0 * 3 + 1]) * k,
      RAIL.tangents[i0 * 3 + 2] + (RAIL.tangents[i1 * 3 + 2] - RAIL.tangents[i0 * 3 + 2]) * k
    )
    .normalize();
}

export function railRollAt(p: number): number {
  const f = THREE.MathUtils.clamp(p, 0, 1) * (RAIL_SAMPLES - 1);
  const i0 = Math.min(Math.floor(f), RAIL_SAMPLES - 2);
  const k = f - i0;
  return RAIL.rolls[i0] + (RAIL.rolls[i0 + 1] - RAIL.rolls[i0]) * k;
}

// station progress = rail sample nearest to each core
export const STATION_PROGRESS: number[] = REGIONS.map((region) => {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < RAIL_SAMPLES; i++) {
    const dx = RAIL.positions[i * 3] - region.position.x;
    const dy = RAIL.positions[i * 3 + 1] - region.position.y;
    const dz = RAIL.positions[i * 3 + 2] - region.position.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best / (RAIL_SAMPLES - 1);
});
REGIONS.forEach((r, i) => {
  r.progress = STATION_PROGRESS[i];
});

// ========================= WORLD GEOMETRY DATA =========================

export interface PointCloudData {
  positions: Float32Array;
  seeds: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  count: number;
}

export interface ClusterData extends PointCloudData {
  regionIndex: number;
}

export interface EdgeData {
  /** vertex pairs, ready for LineSegments */
  positions: Float32Array;
  /** per-vertex alpha */
  alphas: Float32Array;
  segmentCount: number;
}

export interface AxonData {
  segmentPositions: Float32Array;
  segmentAlphas: Float32Array;
  curveSamples: Float32Array[]; // 80 * 3 each, for pulse travel
  pulses: { curve: number; speed: number; offset: number }[];
}

export interface InteriorWorld {
  /** volume + rail-corridor network nodes */
  ambient: PointCloudData;
  /** cortex silhouette points (thin band at the boundary) */
  shell: PointCloudData;
  /** near-camera parallax dust along the rail */
  dust: PointCloudData;
  /** 5 station ganglia (own draw call each for per-station uSwell) */
  clusters: ClusterData[];
  /** ambient + cluster synapse line segments */
  edges: EdgeData;
  /** long-range tracts between station cores, with travelling pulses */
  tracts: AxonData;
}

function gaussianPair(rand: () => number): [number, number] {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  const mag = Math.sqrt(-2 * Math.log(u1));
  return [mag * Math.cos(2 * Math.PI * u2), mag * Math.sin(2 * Math.PI * u2)];
}

// ---- ambient nodes: volume-uniform + rail-corridor hybrid ----

function sampleAmbient(rand: () => number): Float32Array {
  const pts: number[] = [];

  // (a) 1500 volume-uniform rejection samples
  let guard = 0;
  while (pts.length / 3 < 1500 && guard++ < 60000) {
    const x = -28 + rand() * 56;
    const y = -15 + rand() * 35;
    const z = -26 + rand() * 54;
    if (brainDistance3(x, y, z) <= 0) pts.push(x, y, z);
  }

  // (b) 900 corridor samples: spherical shell around random rail points so
  // the network surrounds the camera in EVERY direction at EVERY progress
  guard = 0;
  let placed = 0;
  while (placed < 900 && guard++ < 30000) {
    const s = Math.floor(rand() * RAIL_SAMPLES) * 3;
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(rand() * 2 - 1);
    const rad = 2.5 + Math.pow(rand(), 0.7) * 11;
    const x = RAIL.positions[s] + rad * Math.sin(ph) * Math.cos(th);
    const y = RAIL.positions[s + 1] + rad * Math.cos(ph);
    const z = RAIL.positions[s + 2] + rad * Math.sin(ph) * Math.sin(th);
    if (brainDistance3(x, y, z) <= 0.15) {
      pts.push(x, y, z);
      placed++;
    }
  }

  return new Float32Array(pts);
}

function buildAmbient(rand: () => number): PointCloudData {
  const positions = sampleAmbient(rand);
  const count = positions.length / 3;
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const brightness = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i] = rand() * Math.PI * 2;
    const r = rand();
    sizes[i] = r < 0.8 ? 0.5 + rand() * 0.6 : 1.1 + rand() * 0.5;
    brightness[i] = 0.22 + rand() * 0.28;
  }
  return { positions, seeds, sizes, brightness, count };
}

// ---- cortex shell: thin band at the lobe surfaces ----

function buildShell(rand: () => number): PointCloudData {
  const TARGET = 1400;
  const pts: number[] = [];
  const seeds: number[] = [];
  const sizes: number[] = [];
  const brightness: number[] = [];

  let guard = 0;
  while (pts.length / 3 < TARGET && guard++ < 80000) {
    // sample near a random lobe's surface, then verify the band
    const lobe = LOBES[Math.floor(rand() * LOBES.length)];
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(rand() * 2 - 1);
    const scale = 0.9 + rand() * 0.12;
    const x = lobe.c[0] + lobe.r[0] * scale * Math.sin(ph) * Math.cos(th);
    const y = lobe.c[1] + lobe.r[1] * scale * Math.cos(ph);
    const z = lobe.c[2] + lobe.r[2] * scale * Math.sin(ph) * Math.sin(th);
    const d = brainDistance3(x, y, z);
    if (d > -0.12 && d < 0) {
      pts.push(x, y, z);
      seeds.push(rand() * Math.PI * 2);
      sizes.push(0.5 + rand() * 0.7);
      brightness.push(0.18 + rand() * 0.14);
    }
  }

  return {
    positions: new Float32Array(pts),
    seeds: new Float32Array(seeds),
    sizes: new Float32Array(sizes),
    brightness: new Float32Array(brightness),
    count: pts.length / 3,
  };
}

// ---- dust: tiny near-camera motes hugging the rail ----

function buildDust(rand: () => number): PointCloudData {
  const COUNT = 800;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);
  const brightness = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const s = Math.floor(rand() * RAIL_SAMPLES) * 3;
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(rand() * 2 - 1);
    const rad = 0.9 + rand() * 5.1;
    positions[i * 3] = RAIL.positions[s] + rad * Math.sin(ph) * Math.cos(th);
    positions[i * 3 + 1] = RAIL.positions[s + 1] + rad * Math.cos(ph);
    positions[i * 3 + 2] = RAIL.positions[s + 2] + rad * Math.sin(ph) * Math.sin(th);
    seeds[i] = rand() * Math.PI * 2;
    sizes[i] = 0.35 + rand() * 0.45;
    brightness[i] = 0.06 + rand() * 0.08;
  }
  return { positions, seeds, sizes, brightness, count: COUNT };
}

// ---- station ganglia ----

function buildCluster(rand: () => number, regionIndex: number): ClusterData {
  const BALL = 260;
  const KNOT = 30;
  const count = BALL + KNOT;
  const core = REGIONS[regionIndex].position;

  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const brightness = new Float32Array(count);

  for (let i = 0; i < BALL; i++) {
    const [gx, gy] = gaussianPair(rand);
    const [gz] = gaussianPair(rand);
    positions[i * 3] = core.x + gx * 2.2;
    positions[i * 3 + 1] = core.y + gy * 2.2;
    positions[i * 3 + 2] = core.z + gz * 2.2;
    seeds[i] = rand() * Math.PI * 2;
    sizes[i] = 0.7 + rand() * 1.1;
    brightness[i] = 0.3 + rand() * 0.3;
  }
  for (let i = 0; i < KNOT; i++) {
    const idx = BALL + i;
    const [gx, gy] = gaussianPair(rand);
    const [gz] = gaussianPair(rand);
    positions[idx * 3] = core.x + gx * 0.55;
    positions[idx * 3 + 1] = core.y + gy * 0.55;
    positions[idx * 3 + 2] = core.z + gz * 0.55;
    seeds[idx] = rand() * Math.PI * 2;
    sizes[idx] = 2.2 + rand() * 1.8;
    brightness[idx] = 0.8 + rand() * 0.2;
  }

  return { positions, seeds, sizes, brightness, count, regionIndex };
}

// ---- edges: nearest-neighbor synapses via spatial hash ----

function buildEdges(
  rand: () => number,
  ambient: PointCloudData,
  clusters: ClusterData[]
): EdgeData {
  const pos: number[] = [];
  const alpha: number[] = [];

  const connect = (
    positions: Float32Array,
    count: number,
    maxDist: number,
    keepP: number,
    aLo: number,
    aHi: number
  ) => {
    const cell = maxDist;
    const grid = new Map<string, number[]>();
    const keyOf = (x: number, y: number, z: number) =>
      `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    for (let i = 0; i < count; i++) {
      const k = keyOf(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      const arr = grid.get(k);
      if (arr) arr.push(i);
      else grid.set(k, [i]);
    }
    const seen = new Set<number>();
    for (let i = 0; i < count; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const cz = Math.floor(z / cell);
      // collect candidates from the 27 neighboring cells
      const cands: { j: number; d: number }[] = [];
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++)
          for (let oz = -1; oz <= 1; oz++) {
            const arr = grid.get(`${cx + ox},${cy + oy},${cz + oz}`);
            if (!arr) continue;
            for (const j of arr) {
              if (j === i) continue;
              const dx = positions[j * 3] - x;
              const dy = positions[j * 3 + 1] - y;
              const dz = positions[j * 3 + 2] - z;
              const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (d < maxDist) cands.push({ j, d });
            }
          }
      cands.sort((p1, p2) => p1.d - p2.d);
      let taken = 0;
      for (const c of cands) {
        if (taken >= 2) break;
        const pairKey = i < c.j ? i * count + c.j : c.j * count + i;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);
        if (rand() > keepP) continue;
        pos.push(x, y, z, positions[c.j * 3], positions[c.j * 3 + 1], positions[c.j * 3 + 2]);
        const a1 = aLo + rand() * (aHi - aLo);
        alpha.push(a1, a1 * (0.8 + rand() * 0.4));
        taken++;
      }
    }
  };

  connect(ambient.positions, ambient.count, 4.5, 0.55, 0.06, 0.14);
  for (const cluster of clusters) {
    connect(cluster.positions, cluster.count, 2.8, 0.6, 0.12, 0.2);
  }

  return {
    positions: new Float32Array(pos),
    alphas: new Float32Array(alpha),
    segmentCount: pos.length / 6,
  };
}

// ---- tracts between station cores, with travelling pulses ----

function buildTracts(rand: () => number): AxonData {
  const SAMPLES = 80;
  const curves: THREE.CatmullRomCurve3[] = [];

  // all 10 station pairs + 8 extra random pairs = 18 tracts
  const pairs: [number, number][] = [];
  for (let i = 0; i < 5; i++)
    for (let j = i + 1; j < 5; j++) pairs.push([i, j]);
  for (let k = 0; k < 8; k++) {
    const i = Math.floor(rand() * 5);
    let j = Math.floor(rand() * 5);
    if (j === i) j = (j + 1) % 5;
    pairs.push([i, j]);
  }

  const insideJitter = (base: THREE.Vector3): THREE.Vector3 => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const p = new THREE.Vector3(
        base.x + (rand() - 0.5) * 10,
        base.y + (rand() - 0.5) * 10,
        base.z + (rand() - 0.5) * 10
      );
      if (brainDistance3(p.x, p.y, p.z) < -0.05) return p;
    }
    return base.clone();
  };

  for (const [i, j] of pairs) {
    const a = REGIONS[i].position;
    const b = REGIONS[j].position;
    const mid1 = insideJitter(a.clone().lerp(b, 0.33));
    const mid2 = insideJitter(a.clone().lerp(b, 0.66));
    curves.push(new THREE.CatmullRomCurve3([a.clone(), mid1, mid2, b.clone()]));
  }

  const curveSamples: Float32Array[] = [];
  const segPos: number[] = [];
  const segAlpha: number[] = [];
  for (const curve of curves) {
    const pts = curve.getPoints(SAMPLES - 1);
    const flat = new Float32Array(SAMPLES * 3);
    pts.forEach((p, i) => {
      flat[i * 3] = p.x;
      flat[i * 3 + 1] = p.y;
      flat[i * 3 + 2] = p.z;
    });
    curveSamples.push(flat);
    for (let i = 0; i < pts.length - 1; i++) {
      segPos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
      const a1 = 0.07 + rand() * 0.06;
      segAlpha.push(a1, a1);
    }
  }

  const pulses: { curve: number; speed: number; offset: number }[] = [];
  for (let c = 0; c < curves.length; c++) {
    for (let k = 0; k < 3; k++) {
      pulses.push({ curve: c, speed: 0.04 + rand() * 0.05, offset: rand() });
    }
  }

  return {
    segmentPositions: new Float32Array(segPos),
    segmentAlphas: new Float32Array(segAlpha),
    curveSamples,
    pulses,
  };
}

export function generateInteriorWorld(seed = 42): InteriorWorld {
  const rand = seededRandom(seed);
  const ambient = buildAmbient(rand);
  const shell = buildShell(rand);
  const dust = buildDust(rand);
  const clusters = REGIONS.map((_, i) => buildCluster(rand, i));
  const edges = buildEdges(rand, ambient, clusters);
  const tracts = buildTracts(rand);
  return { ambient, shell, dust, clusters, edges, tracts };
}
