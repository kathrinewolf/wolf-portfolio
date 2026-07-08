import * as THREE from "three";
import {
  STATIONS,
  ROOM_HALF_X,
  ROOM_HALF_Z,
} from "@/lib/room-world";

// Procedural CanvasTextures for the Operator's Room. Everything is
// generated once at mount — no external assets. Color maps are sRGB;
// roughness/bump/ao stay linear.

function grain(ctx: CanvasRenderingContext2D, size: number, amp: number) {
  const id = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < id.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amp;
    id.data[i] += n;
    id.data[i + 1] += n;
    id.data[i + 2] += n;
  }
  ctx.putImageData(id, 0, 0);
}

function canvasTex(
  size: number,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
  opts: { srgb?: boolean; repeat?: [number, number] } = {}
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---- floor: 512px tile = 2x2m, repeated 7x5 ----

export function makeFloorMaps() {
  const map = canvasTex(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#16181f";
      ctx.fillRect(0, 0, s, s);
      // panel seams (tile border = 2m grid)
      ctx.strokeStyle = "#0a0c10";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, s, s);
      ctx.strokeStyle = "#0d0f15";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s / 2, 0);
      ctx.lineTo(s / 2, s);
      ctx.stroke();
      // corner bolts
      for (const [x, y] of [
        [12, 12],
        [500, 12],
        [12, 500],
        [500, 500],
      ]) {
        ctx.fillStyle = "#1e222c";
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#080a0e";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // faint smudges
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = "#20242f";
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.translate(Math.random() * s, Math.random() * s);
        ctx.rotate(Math.random() * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, 90, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      grain(ctx, s, 8);
    },
    { srgb: true, repeat: [7, 5] }
  );

  const rough = canvasTex(
    512,
    (ctx, s) => {
      ctx.fillStyle = "rgb(110,110,110)";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgb(190,190,190)";
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, s, s);
      // polished traffic streaks along walk direction
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "rgb(60,60,60)";
      for (let i = 0; i < 10; i++) {
        ctx.save();
        ctx.translate(Math.random() * s, Math.random() * s);
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 150, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // scuffs
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "rgb(170,170,170)";
      for (let i = 0; i < 20; i++) {
        ctx.save();
        ctx.translate(Math.random() * s, Math.random() * s);
        ctx.rotate(Math.random() * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, 15 + Math.random() * 25, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      grain(ctx, s, 14);
    },
    { repeat: [7, 5] }
  );

  // whole-floor AO: wall contact + furniture contact shadows — grounds
  // every piece of furniture without a shadow map
  const ao = canvasTex(1024, (ctx, s) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);
    ctx.filter = "blur(30px)";
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 70;
    ctx.strokeRect(0, 0, s, s);
    for (const st of STATIONS) {
      const u = ((st.position.x + ROOM_HALF_X) / (ROOM_HALF_X * 2)) * s;
      const v = ((st.position.z + ROOM_HALF_Z) / (ROOM_HALF_Z * 2)) * s;
      const w = ((st.size[0] * 1.25) / (ROOM_HALF_X * 2)) * s;
      const h = ((st.size[2] * 1.25) / (ROOM_HALF_Z * 2)) * s;
      ctx.save();
      ctx.translate(u, v);
      ctx.rotate(-st.yaw);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.filter = "none";
  });
  ao.wrapS = ao.wrapT = THREE.ClampToEdgeWrapping;
  ao.repeat.set(1, 1);

  return { map, rough, ao };
}

// ---- walls: 512px tile = 1.8x1.8m ----

export function makeWallMaps(repeatX: number) {
  const map = canvasTex(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#181b26";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#0b0d13";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.lineTo(1, s);
      ctx.stroke();
      ctx.strokeStyle = "#101320";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s / 2, 0);
      ctx.lineTo(s / 2, s);
      ctx.stroke();
      ctx.strokeStyle = "#0d0f16";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s / 2);
      ctx.lineTo(s, s / 2);
      ctx.stroke();
      // per-panel value variation
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, s / 2, s / 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(s / 2, s / 2, s / 2, s / 2);
      ctx.globalAlpha = 1;
      grain(ctx, s, 6);
    },
    { srgb: true, repeat: [repeatX, 2] }
  );

  const rough = canvasTex(
    512,
    (ctx, s) => {
      ctx.fillStyle = "rgb(150,150,150)";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgb(200,200,200)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(1, 0);
      ctx.lineTo(1, s);
      ctx.stroke();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = "rgb(90,90,90)";
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * s;
        ctx.fillRect(x, 0, 10, s);
      }
      ctx.globalAlpha = 1;
      grain(ctx, s, 12);
    },
    { repeat: [repeatX, 2] }
  );

  return { map, rough };
}

// ---- furniture: brushed metal roughness, 256px ----

export function makeBrushedRoughness(rotated = false) {
  const t = canvasTex(
    256,
    (ctx, s) => {
      ctx.fillStyle = "rgb(95,95,95)";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 400; i++) {
        const y = Math.random() * s;
        const len = 40 + Math.random() * 216;
        const x = Math.random() * (s - len);
        ctx.globalAlpha = 0.05 + Math.random() * 0.07;
        ctx.fillStyle = Math.random() > 0.5 ? "rgb(140,140,140)" : "rgb(60,60,60)";
        ctx.fillRect(x, y, len, 1);
      }
      ctx.globalAlpha = 1;
      grain(ctx, s, 10);
    },
    { repeat: [2, 2] }
  );
  if (rotated) {
    t.rotation = Math.PI / 2;
    t.center.set(0.5, 0.5);
  }
  return t;
}

// ---- floor markings decal: one 2048px canvas over the whole floor ----

export function makeFloorMarkings(): THREE.CanvasTexture {
  const S = 2048;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  // transparent base
  ctx.clearRect(0, 0, S, S);

  const toU = (x: number) => ((x + ROOM_HALF_X) / (ROOM_HALF_X * 2)) * S;
  const toV = (z: number) => ((z + ROOM_HALF_Z) / (ROOM_HALF_Z * 2)) * S;
  const mx = S / (ROOM_HALF_X * 2); // px per meter in x
  const ink = (a: number) => `rgba(215, 224, 240, ${a})`;

  // dashed guide arc around the console
  ctx.strokeStyle = ink(0.32);
  ctx.lineWidth = 0.035 * mx;
  ctx.setLineDash([0.22 * mx, 0.16 * mx]);
  ctx.beginPath();
  ctx.arc(toU(0), toV(-3.3), 2.3 * mx, -Math.PI * 0.05, Math.PI * 1.05);
  ctx.stroke();

  // dashed center walkway + branch to the personal desk
  ctx.beginPath();
  ctx.moveTo(toU(0), toV(-2.4));
  ctx.lineTo(toU(0), toV(3.4));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toU(0), toV(2.6));
  ctx.lineTo(toU(-4.6), toV(2.6));
  ctx.lineTo(toU(-4.6), toV(3.2));
  ctx.stroke();
  ctx.setLineDash([]);

  // stenciled station numbers on the approach side of each station
  ctx.font = `700 ${0.5 * mx}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.fillStyle = ink(0.16);
  const stencil: [string, number, number, number][] = [
    ["01", 0, -2.1, 0],
    ["02", -4.35, -2.9, 0],
    ["03", 4.9, -1.4, Math.PI / 2],
    ["04", -4.2, 2.4, 0],
    ["05", 3.2, 3.1, 0],
  ];
  for (const [num, x, z, rot] of stencil) {
    ctx.save();
    ctx.translate(toU(x), toV(z));
    ctx.rotate(rot);
    ctx.fillText(num, 0, 0);
    ctx.restore();
  }

  // hazard stripes in front of the transmitter
  ctx.save();
  ctx.translate(toU(3.3), toV(3.75));
  const bw = 2.0 * mx;
  const bh = 0.25 * mx;
  ctx.beginPath();
  ctx.rect(-bw / 2, -bh / 2, bw, bh);
  ctx.clip();
  ctx.strokeStyle = "rgba(143, 163, 200, 0.25)";
  ctx.lineWidth = 0.07 * mx;
  for (let x = -bw / 2 - bh; x < bw / 2 + bh; x += 0.2 * mx) {
    ctx.beginPath();
    ctx.moveTo(x, bh / 2);
    ctx.lineTo(x + bh, -bh / 2);
    ctx.stroke();
  }
  ctx.restore();

  // corner brackets around each station footprint
  ctx.strokeStyle = ink(0.22);
  ctx.lineWidth = 0.03 * mx;
  for (const st of STATIONS) {
    const hw = (st.size[0] / 2 + 0.35) * mx;
    const hh = (st.size[2] / 2 + 0.35) * mx;
    const arm = 0.25 * mx;
    ctx.save();
    ctx.translate(toU(st.position.x), toV(st.position.z));
    ctx.rotate(-st.yaw);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(sx * hw - sx * arm, sy * hh);
      ctx.lineTo(sx * hw, sy * hh);
      ctx.lineTo(sx * hw, sy * hh - sy * arm);
      ctx.stroke();
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
