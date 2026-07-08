import * as THREE from "three";
import {
  SPAWN_POS,
  STATIONS,
  resolveCollision,
  nearestStation,
} from "@/lib/room-world";

// First-person walk controller for the Operator's Room — with a body.
// The camera sits at eye height; a first-person body rig (hips, legs,
// arms) hangs beneath it so looking down shows your own legs striding.
// Comfort contract: the camera translates/rotates ONLY from direct user
// input; station jumps are instant broadcast cuts.

export const WALK_SPEED = 2.2; // m/s
export const TURN_SPEED = 2.15; // rad/s (arrow-key turning)
export const JOY_TURN_SPEED = 1.15; // rad/s at full joystick deflection
export const EYE = 1.62;
export const LOOK_SENS = 0.0032; // rad per px
export const PITCH_CLAMP = 1.25; // deep enough to see your own legs

export type WalkMode = "free" | "locked";

export interface WalkState {
  /** feet position (y = 0) */
  pos: THREE.Vector3;
  /** look = body yaw (FP: body follows the view) */
  yaw: number;
  pitch: number;
  vel: THREE.Vector3;
  /** normalized ground speed 0..1 (drives the leg cycle) */
  speed01: number;
  /** accumulated stride phase */
  walkPhase: number;
  keys: Set<string>;
  joy: { x: number; y: number };
  lookDelta: { x: number; y: number };
  mode: WalkMode;
  focusIndex: number;
  hasMoved: boolean;
  dragging: boolean;
  /** double-click destination; cancelled by any manual input */
  walkTarget: THREE.Vector3 | null;
  /** seconds since the spawn drop started; large = not playing */
  spawnT: number;
}

export function createWalk(): WalkState {
  return {
    pos: new THREE.Vector3(SPAWN_POS.x, 0, SPAWN_POS.z),
    yaw: 0,
    pitch: 0,
    vel: new THREE.Vector3(),
    speed01: 0,
    walkPhase: 0,
    keys: new Set(),
    joy: { x: 0, y: 0 },
    lookDelta: { x: 0, y: 0 },
    mode: "free",
    focusIndex: -1,
    hasMoved: false,
    dragging: false,
    walkTarget: null,
    spawnT: 99,
  };
}

export function resetWalk(s: WalkState) {
  s.pos.set(SPAWN_POS.x, 0, SPAWN_POS.z);
  s.yaw = 0;
  s.pitch = 0;
  s.vel.set(0, 0, 0);
  s.speed01 = 0;
  s.walkPhase = 0;
  s.keys.clear();
  s.joy.x = 0;
  s.joy.y = 0;
  s.lookDelta.x = 0;
  s.lookDelta.y = 0;
  s.mode = "free";
  s.focusIndex = -1;
  s.dragging = false;
  s.walkTarget = null;
  s.spawnT = 99;
}

/** instant broadcast cut to a station's vantage, facing it */
export function cutToStation(s: WalkState, stationIndex: number) {
  const st = STATIONS[stationIndex];
  s.pos.set(st.vantagePos.x, 0, st.vantagePos.z);
  const d = new THREE.Vector3().subVectors(st.vantageTarget, st.vantagePos);
  s.yaw = Math.atan2(-d.x, -d.z);
  s.pitch = THREE.MathUtils.clamp(Math.atan2(d.y - EYE, Math.hypot(d.x, d.z)), -0.5, 0.2);
  s.vel.set(0, 0, 0);
  s.speed01 = 0;
  s.focusIndex = stationIndex;
}

export type WalkEvent =
  | { type: "focus"; station: number }
  | { type: "defocus" }
  | null;

const tmpFrom = new THREE.Vector3();
const tmpDir = new THREE.Vector3();

export function stepWalk(s: WalkState, dt: number): WalkEvent {
  if (s.spawnT < 9) s.spawnT += dt;

  // ---- look: consume accumulated drag 1:1 ----
  if (s.mode === "free") {
    s.yaw -= s.lookDelta.x * LOOK_SENS;
    s.pitch = THREE.MathUtils.clamp(
      s.pitch - s.lookDelta.y * LOOK_SENS,
      -PITCH_CLAMP,
      PITCH_CLAMP
    );
  }
  s.lookDelta.x = 0;
  s.lookDelta.y = 0;

  // ---- arrows turn like a game (tank controls); A/D strafe ----
  let ix = 0;
  let iz = 0;
  if (s.mode === "free") {
    if (s.keys.has("ArrowLeft")) s.yaw += TURN_SPEED * dt;
    if (s.keys.has("ArrowRight")) s.yaw -= TURN_SPEED * dt;
    if (s.keys.has("KeyW") || s.keys.has("ArrowUp")) iz -= 1;
    if (s.keys.has("KeyS") || s.keys.has("ArrowDown")) iz += 1;
    if (s.keys.has("KeyA")) ix -= 1;
    if (s.keys.has("KeyD")) ix += 1;
    // joystick: x TURNS like the arrows (never strafes — strafing while
    // looking forward reads as broken on touch), y walks. Quadratic
    // response: precise near center, calm at full deflection.
    if (Math.abs(s.joy.x) > 0.12) {
      s.yaw -= s.joy.x * Math.abs(s.joy.x) * JOY_TURN_SPEED * dt;
    }
    iz += s.joy.y;
  }
  let len = Math.hypot(ix, iz);
  if (len > 1) {
    ix /= len;
    iz /= len;
  }

  // any manual input cancels a double-click destination
  if (
    len > 0.05 ||
    s.keys.has("ArrowLeft") ||
    s.keys.has("ArrowRight") ||
    Math.abs(s.joy.x) > 0.12
  ) {
    s.walkTarget = null;
  }

  const sin = Math.sin(s.yaw);
  const cos = Math.cos(s.yaw);
  // forward is (-sin, -cos), right is (cos, -sin): forward is ALWAYS
  // where you look
  tmpDir.set(iz * sin + ix * cos, 0, iz * cos - ix * sin);

  // double-click walk-to: translation only, never rotates the camera
  if (s.mode === "free" && s.walkTarget && len < 0.05) {
    const dx = s.walkTarget.x - s.pos.x;
    const dz = s.walkTarget.z - s.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.18) {
      s.walkTarget = null;
    } else {
      tmpDir.set(dx / dist, 0, dz / dist);
      len = 1;
      s.hasMoved = true;
    }
  }

  const k = 1 - Math.exp(-10 * dt);
  s.vel.x += (tmpDir.x * WALK_SPEED * Math.min(len, 1) - s.vel.x) * k;
  s.vel.z += (tmpDir.z * WALK_SPEED * Math.min(len, 1) - s.vel.z) * k;
  const speed = Math.hypot(s.vel.x, s.vel.z);
  s.speed01 = THREE.MathUtils.clamp(speed / WALK_SPEED, 0, 1);

  if (speed > 0.02) {
    tmpFrom.copy(s.pos);
    s.pos.x += s.vel.x * dt;
    s.pos.z += s.vel.z * dt;
    resolveCollision(tmpFrom, s.pos);
    // if a wall stops progress toward a walk target, give up on it
    if (s.walkTarget && s.pos.distanceTo(tmpFrom) < 0.002) {
      s.walkTarget = null;
    }
    // stride phase tied to distance travelled (legs never moonwalk)
    s.walkPhase += speed * dt * 3.6;
    if (len > 0.05) s.hasMoved = true;
  }

  // ---- station focus by proximity ----
  let event: WalkEvent = null;
  if (s.mode === "free") {
    const { index, dist } = nearestStation(s.pos);
    const inRange = index >= 0 && dist < STATIONS[index].focusRadius;
    if (inRange && s.focusIndex !== index) {
      s.focusIndex = index;
      event = { type: "focus", station: index };
    } else if (!inRange && s.focusIndex !== -1) {
      s.focusIndex = -1;
      event = { type: "defocus" };
    }
  }
  return event;
}

/** movement keys; Enter is intentionally unbound — the quickstart screen
 *  is the only doorway into the sections */
export function bindWalkKeys(
  s: WalkState,
  enabled: () => boolean
): () => void {
  const MOVEMENT = [
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
  ];
  const down = (e: KeyboardEvent) => {
    if (!enabled()) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    if (MOVEMENT.includes(e.code)) {
      e.preventDefault();
      s.keys.add(e.code);
      s.hasMoved = true;
    }
  };
  const up = (e: KeyboardEvent) => {
    s.keys.delete(e.code);
  };
  const blur = () => s.keys.clear();
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
  };
}
