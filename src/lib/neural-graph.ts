// Seeded random for deterministic layout
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface NeuralNode {
  id: string;
  position: [number, number, number];
  size: number;
  type: "hub" | "connector" | "ambient";
  label?: string;
  contentKey?: string;
  description?: string;
  connections: string[];
}

export interface NeuralGraph {
  nodes: NeuralNode[];
  edges: [string, string][];
}

const HUB_DEFINITIONS = [
  { id: "hub-playground", label: "Projects", contentKey: "playground", description: "Things I'm building" },
  { id: "hub-craft", label: "What I Do", contentKey: "craft", description: "Skills & approach" },
  { id: "hub-work", label: "Work Experience", contentKey: "work", description: "Professional timeline" },
  { id: "hub-who", label: "Who Is This Guy?", contentKey: "who-i-am", description: "The person behind the work" },
  { id: "hub-connect", label: "Get In Touch", contentKey: "connect", description: "Let's talk" },
];

// Projects at top (read first), then clockwise
const HUB_POSITIONS: [number, number, number][] = [
  [0, 2.4, 0.15],        // Projects — top center (read first)
  [3.2, 0.8, -0.15],     // What I Do — right upper
  [2.0, -1.8, 0.1],      // Work Experience — right lower
  [-2.0, -1.8, -0.1],    // Who Is This Guy? — left lower
  [-3.2, 0.8, 0.15],     // Get In Touch — left upper
];

// Brain shape — asymmetric side-view profile with distinct lobes
function brainDistance(x: number, y: number): number {
  // Frontal lobe: large, bulges forward (left in side-view), higher
  const f1 = ((x + 1.5) ** 2) / (3.2 ** 2) + ((y - 1.0) ** 2) / (2.6 ** 2) - 1;

  // Parietal lobe: top-center dome
  const p1 = ((x - 0.2) ** 2) / (2.5 ** 2) + ((y - 1.8) ** 2) / (1.5 ** 2) - 1;

  // Temporal lobe: lower bulge, slightly forward
  const t1 = ((x + 0.5) ** 2) / (3.5 ** 2) + ((y + 0.3) ** 2) / (1.8 ** 2) - 1;

  // Occipital lobe: back of brain (right side), tapers
  const o1 = ((x - 2.0) ** 2) / (2.2 ** 2) + ((y - 0.3) ** 2) / (2.2 ** 2) - 1;

  // Brain core: fills the center to prevent hollow middle
  const core = (x ** 2) / (2.8 ** 2) + ((y - 0.2) ** 2) / (1.8 ** 2) - 1;

  // Brain stem: narrow downward extension
  const bs = ((x - 0.8) ** 2) / (1.2 ** 2) + ((y + 2.0) ** 2) / (1.0 ** 2) - 1;

  // Cerebellum: distinct dense lobe at bottom-back
  const cb = ((x - 2.5) ** 2) / (1.4 ** 2) + ((y + 1.8) ** 2) / (1.0 ** 2) - 1;

  return Math.min(f1, p1, t1, o1, core, bs, cb);
}

function isInsideBrain(x: number, y: number): boolean {
  return brainDistance(x, y) <= 0;
}

function brainDepth(x: number, y: number): number {
  const d = -brainDistance(x, y);
  return Math.max(0, Math.min(1, d / 1.5));
}

export function generateGraph(seed = 42): NeuralGraph {
  const rand = seededRandom(seed);
  const nodes: NeuralNode[] = [];
  const edges: [string, string][] = [];
  const edgeSet = new Set<string>();

  const addEdge = (a: string, b: string) => {
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push([a, b]);
    }
  };

  // Hub nodes
  HUB_DEFINITIONS.forEach((hub, i) => {
    nodes.push({
      id: hub.id,
      position: HUB_POSITIONS[i],
      size: 0.18,
      type: "hub",
      label: hub.label,
      contentKey: hub.contentKey,
      description: hub.description,
      connections: [],
    });
  });

  // === REFINED NODE PLACEMENT ===
  // Fewer nodes, more intentional. Negative space matters.

  const MIN_SPACING_SQ = 0.04; // ~0.2 unit — dense but not overlapping

  function isTooClose(x: number, y: number): boolean {
    for (const hp of HUB_POSITIONS) {
      const dx = x - hp[0]; const dy = y - hp[1];
      if (dx * dx + dy * dy < 0.36) return true;
    }
    for (let j = 5; j < nodes.length; j++) {
      const dx = x - nodes[j].position[0]; const dy = y - nodes[j].position[1];
      if (dx * dx + dy * dy < MIN_SPACING_SQ) return true;
    }
    return false;
  }

  // Boundary nodes — dense, continuous outline that defines the brain silhouette
  let placed = 0;
  let attempts = 0;
  while (placed < 200 && attempts < 8000) {
    attempts++;
    const x = (rand() - 0.5) * 12;
    const y = (rand() - 0.5) * 8;
    const depth = brainDepth(x, y);
    if (depth <= 0 || depth > 0.25) continue;
    if (isTooClose(x, y)) continue;

    nodes.push({
      id: `b-${placed}`,
      position: [x, y, (rand() - 0.5) * 0.5],
      size: 0.01 + rand() * 0.018,
      type: "ambient",
      connections: [],
    });
    placed++;
  }

  // Interior nodes — fill brain completely
  placed = 0;
  attempts = 0;
  while (placed < 300 && attempts < 8000) {
    attempts++;
    const x = (rand() - 0.5) * 12;
    const y = (rand() - 0.5) * 8;
    if (!isInsideBrain(x, y)) continue;
    if (isTooClose(x, y)) continue;

    const depth = brainDepth(x, y);

    nodes.push({
      id: `a-${placed}`,
      position: [x, y, (rand() - 0.5) * 1.0],
      size: 0.012 + rand() * 0.028 + depth * 0.015,
      type: "ambient",
      connections: [],
    });
    placed++;
  }

  // Center-fill pass: extra nodes in the core to prevent hollow middle
  placed = 0;
  attempts = 0;
  while (placed < 60 && attempts < 3000) {
    attempts++;
    // Bias toward center of brain
    const x = (rand() - 0.5) * 5;
    const y = (rand() - 0.4) * 3.5;
    if (!isInsideBrain(x, y)) continue;
    if (isTooClose(x, y)) continue;

    nodes.push({
      id: `c-${placed}`,
      position: [x, y, (rand() - 0.5) * 0.8],
      size: 0.015 + rand() * 0.025,
      type: "ambient",
      connections: [],
    });
    placed++;
  }

  // === CONNECTIONS ===
  const nodeMap = new Map<string, NeuralNode>();
  nodes.forEach(n => nodeMap.set(n.id, n));
  const ambientNodes = nodes.filter(n => n.type === "ambient");

  // Hub connections — sparse, organic
  for (const hub of nodes.filter(n => n.type === "hub")) {
    const nearby = ambientNodes
      .map(a => {
        const dx = hub.position[0] - a.position[0];
        const dy = hub.position[1] - a.position[1];
        return { id: a.id, dist: Math.sqrt(dx * dx + dy * dy) };
      })
      .filter(d => d.dist < 2.2)
      .sort((a, b) => a.dist - b.dist);
    const candidates = nearby.slice(0, 10);
    let picked = 0;
    for (const c of candidates) {
      if (picked >= 5) break;
      if (rand() > 0.2) { addEdge(hub.id, c.id); picked++; }
    }
  }

  // Ambient connections — dense boundary tracing, medium interior
  for (let i = 0; i < ambientNodes.length; i++) {
    const a = ambientNodes[i];
    const aDepth = brainDepth(a.position[0], a.position[1]);
    const isBoundary = aDepth < 0.25;
    const maxNeighbors = isBoundary ? 4 : 3;
    const maxRadius = isBoundary ? 0.7 : 0.9;

    const dists: { id: string; dist: number }[] = [];
    for (let j = 0; j < ambientNodes.length; j++) {
      if (i === j) continue;
      const b = ambientNodes[j];
      const dx = a.position[0] - b.position[0];
      const dy = a.position[1] - b.position[1];
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < maxRadius) dists.push({ id: b.id, dist: d });
    }
    dists.sort((x, y) => x.dist - y.dist);
    for (let k = 0; k < Math.min(maxNeighbors, dists.length); k++) {
      if (rand() > 0.08) addEdge(a.id, dists[k].id);
    }
  }

  // A few long-range pathways — subtle neural tracts
  for (let i = 0; i < 15; i++) {
    const a = ambientNodes[Math.floor(rand() * ambientNodes.length)];
    const b = ambientNodes[Math.floor(rand() * ambientNodes.length)];
    if (a.id !== b.id) {
      const dx = a.position[0] - b.position[0];
      const dy = a.position[1] - b.position[1];
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 2.0 && d < 4.0) addEdge(a.id, b.id);
    }
  }

  // Populate connection arrays
  const connectionMap = new Map<string, Set<string>>();
  for (const [a, b] of edges) {
    if (!connectionMap.has(a)) connectionMap.set(a, new Set());
    if (!connectionMap.has(b)) connectionMap.set(b, new Set());
    connectionMap.get(a)!.add(b);
    connectionMap.get(b)!.add(a);
  }
  for (const node of nodes) {
    node.connections = Array.from(connectionMap.get(node.id) ?? []);
  }

  return { nodes, edges };
}
