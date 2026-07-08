import * as THREE from "three";

// The Operator's Room: a small mission-control room inside Alexander's
// head. The visitor spawns facing the main console; stations are placed
// so discovery follows the owner's priority order. All numbers are
// meters-ish; eye height 1.6.
//
// Station order (owner-specified): 01 What I Do (central console, first
// thing you see), 02 Projects (monitor wall, front-left), 03 Work
// Experience (career plotter, right wall), 04 Who Is This Guy (personal
// desk, back-left corner), 05 Get In Touch (transmitter, back wall —
// deliberately behind the spawn, the last thing you find).

export const EYE_HEIGHT = 1.6;
export const PLAYER_RADIUS = 0.35;

// room interior half-extents (walls at ±)
export const ROOM_HALF_X = 7;
export const ROOM_HALF_Z = 5;
export const ROOM_HEIGHT = 3.6;

// window opening in the front wall (z = -ROOM_HALF_Z)
export const WINDOW = { x0: -3, x1: 3, y0: 1.15, y1: 3.05 };

// third-person: character spawns here (feet at y=0); the follow camera
// needs room behind, so spawn sits forward of the back wall
export const SPAWN_POS = new THREE.Vector3(0, EYE_HEIGHT, 1.5);
/** yaw 0 faces -z (toward the console + window) */
export const SPAWN_YAW = 0;

export interface RoomStation {
  id: string;
  number: string;
  label: string;
  contentKey: string;
  description: string;
  /** furniture center */
  position: THREE.Vector3;
  /** furniture yaw (0 = facing -z, object's front toward the room) */
  yaw: number;
  /** furniture footprint (full sizes) for collision + geometry */
  size: [number, number, number];
  /** floating label anchor */
  labelAnchor: THREE.Vector3;
  /** hand-composed shot: camera position + look target for the cut */
  vantagePos: THREE.Vector3;
  vantageTarget: THREE.Vector3;
  /** distance at which the station highlights and becomes clickable */
  focusRadius: number;
}

const S = (
  id: string,
  number: string,
  label: string,
  contentKey: string,
  description: string,
  pos: [number, number, number],
  yaw: number,
  size: [number, number, number],
  vantagePos: [number, number, number],
  labelY: number,
  focusRadius = 3.2
): RoomStation => ({
  id,
  number,
  label,
  contentKey,
  description,
  position: new THREE.Vector3(pos[0], pos[1], pos[2]),
  yaw,
  size,
  labelAnchor: new THREE.Vector3(pos[0], labelY, pos[2]),
  vantagePos: new THREE.Vector3(vantagePos[0], vantagePos[1], vantagePos[2]),
  vantageTarget: new THREE.Vector3(pos[0], pos[1] + size[1] * 0.25, pos[2]),
  focusRadius,
});

export const STATIONS: RoomStation[] = [
  // 01 — central console, dead ahead from spawn
  S(
    "station-craft",
    "01",
    "What I Do",
    "craft",
    "Skills & approach",
    [0, 0.55, -3.3],
    0,
    [3.0, 1.1, 1.05],
    [0, EYE_HEIGHT, -1.15],
    2.35
  ),
  // 02 — monitor wall, front-left, angled toward spawn
  S(
    "station-playground",
    "02",
    "Projects",
    "playground",
    "AI agents & experiments",
    [-4.7, 1.75, -4.55],
    0.18,
    [3.9, 2.5, 0.35],
    [-4.35, EYE_HEIGHT, -2.05],
    3.3,
    3.4
  ),
  // 03 — career tape plotter, right wall
  S(
    "station-work",
    "03",
    "Work Experience",
    "work",
    "Professional timeline",
    [6.55, 1.35, -1.4],
    -Math.PI / 2,
    [0.55, 2.1, 2.6],
    [4.45, EYE_HEIGHT, -1.4],
    2.7
  ),
  // 04 — personal desk, back-left corner
  S(
    "station-who",
    "04",
    "Who Is This Guy?",
    "who-i-am",
    "The person behind the work",
    [-5.7, 0.45, 3.35],
    Math.PI * 0.75,
    [1.9, 0.9, 1.0],
    [-3.4, EYE_HEIGHT, 1.45],
    2.1
  ),
  // 05 — transmitter, back wall, behind the spawn
  S(
    "station-connect",
    "05",
    "Get In Touch",
    "connect",
    "Let's talk",
    [3.3, 1.15, 4.6],
    Math.PI,
    [1.7, 2.3, 0.6],
    [3.15, EYE_HEIGHT, 2.55],
    2.9
  ),
];

// ========================= COLLISION =========================

interface Aabb {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

// furniture AABBs, slightly inflated by the player radius
const OBSTACLES: Aabb[] = STATIONS.map((st) => {
  // rotate footprint: for yaw multiples of 90deg swap extents; the two
  // angled pieces use their conservative max extent
  const [sx, , sz] = st.size;
  const quarter = Math.abs(Math.abs(st.yaw) - Math.PI / 2) < 0.3;
  const hx = (quarter ? sz : sx) / 2 + PLAYER_RADIUS * 1.05;
  const hz = (quarter ? sx : sz) / 2 + PLAYER_RADIUS * 1.05;
  return {
    x0: st.position.x - hx,
    x1: st.position.x + hx,
    z0: st.position.z - hz,
    z1: st.position.z + hz,
  };
});

/**
 * Clamp a proposed position to the walkable interior: inside the walls,
 * outside the furniture. Slides along surfaces (axis-separated resolve).
 */
export function resolveCollision(
  from: THREE.Vector3,
  to: THREE.Vector3
): void {
  // walls: a generous clearance so a wall can never fill the whole view
  const WALL_CLEAR = 0.6;
  to.x = THREE.MathUtils.clamp(to.x, -ROOM_HALF_X + WALL_CLEAR, ROOM_HALF_X - WALL_CLEAR);
  to.z = THREE.MathUtils.clamp(to.z, -ROOM_HALF_Z + WALL_CLEAR, ROOM_HALF_Z - WALL_CLEAR);
  // furniture: resolve per axis so you slide along edges instead of sticking
  for (const b of OBSTACLES) {
    const insideX = to.x > b.x0 && to.x < b.x1;
    const insideZ = to.z > b.z0 && to.z < b.z1;
    if (insideX && insideZ) {
      const fromInsideX = from.x > b.x0 && from.x < b.x1;
      const fromInsideZ = from.z > b.z0 && from.z < b.z1;
      if (!fromInsideX) {
        to.x = to.x - from.x > 0 ? b.x0 : b.x1;
      } else if (!fromInsideZ) {
        to.z = to.z - from.z > 0 ? b.z0 : b.z1;
      } else {
        // degenerate (shouldn't happen): push out along the smaller axis
        to.x = from.x;
        to.z = from.z;
      }
    }
  }
}

/** nearest station within its focus radius, else -1 */
export function nearestStation(pos: THREE.Vector3): {
  index: number;
  dist: number;
} {
  let index = -1;
  let dist = Infinity;
  for (let i = 0; i < STATIONS.length; i++) {
    const d = Math.hypot(
      pos.x - STATIONS[i].position.x,
      pos.z - STATIONS[i].position.z
    );
    if (d < dist) {
      dist = d;
      index = i;
    }
  }
  return { index, dist };
}
