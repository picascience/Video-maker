// L'épée carte mère — suit briefs/epee-carte-mere.md.
// Boucle de 10 s : veille -> réveil -> armement -> coup -> coupe -> désintégration -> nouveau robot.

import {
  Frame, Layer, RGB, Scene, SceneOptions, clamp, drawTextCentered, fbm, hash, hex, lerp, mix, orient, ramp,
  shifted, smooth,
} from '../engine';

const W = 180;
const H = 320;
const N = 300;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- palette (29)
const P = {
  ink: hex('#04080c'),
  bg1: hex('#08121a'),
  bg2: hex('#0c1f2a'),
  bg3: hex('#123240'),
  bg4: hex('#1b4a58'),
  bg5: hex('#2a6a74'),
  pcb0: hex('#0a2a1f'),
  pcb1: hex('#0f4a35'),
  pcb2: hex('#17704a'),
  pcb3: hex('#24a066'),
  cu0: hex('#5a3a14'),
  cu1: hex('#a6701f'),
  cu2: hex('#e0a838'),
  cu3: hex('#ffe08a'),
  cy0: hex('#0a4a6a'),
  cy1: hex('#1a8fc0'),
  cy2: hex('#5ad8ff'),
  cy3: hex('#c8f6ff'),
  st0: hex('#1a1f2a'),
  st1: hex('#2c3442'),
  st2: hex('#46526a'),
  st3: hex('#6f7f9a'),
  st4: hex('#a4b4cc'),
  hot0: hex('#a3200f'),
  hot1: hex('#ff5a1f'),
  hot2: hex('#ffb347'),
  hot3: hex('#fff1c8'),
  hs0: hex('#4a2a2a'),
  hs1: hex('#7a3a2a'),
};

const STEEL: [number, RGB][] = [[0, P.st0], [0.3, P.st1], [0.55, P.st2], [0.8, P.st3], [1, P.st4]];
const HEAT: [number, RGB][] = [[0, P.hot3], [0.3, P.hot2], [0.6, P.hot1], [1, P.hs1]];
const SPARK: [number, RGB][] = [[0, P.hot3], [0.25, P.hot2], [0.6, P.hot1], [1, P.hot0]];
const steel = (l: number) => ramp(STEEL, clamp(l));

// ---------------------------------------------------------------- géométrie
const FR_HIT = 105; // première image de la coupe
const TH = -35 * DEG; // angle de l'épée à l'impact
const DU: [number, number] = [Math.cos(TH), Math.sin(TH)]; // axe de la lame (garde -> pointe)
const DN: [number, number] = [-Math.sin(TH), Math.cos(TH)]; // normale, côté tranchant
const DD: [number, number] = [-DU[0], -DU[1]]; // le long de la coupe, vers le bas gauche
const CUT = {x: 96, y: 176};
const FLOOR_Y = 250;

const eo3 = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

// ---------------------------------------------------------------- texture de la lame
const BW = 18;
const BL = 150;
const TRACE = new Uint8Array(BW * BL);

const buildBlade = (): Frame => {
  const f = new Frame(BW, BL);
  const trace = (c: number, r: number, col: RGB) => {
    if (c < 0 || c >= BW || r < 0 || r >= BL) return;
    f.set(c, r, col);
    TRACE[r * BW + c] = 1;
  };
  for (let r = 0; r < BL; r++)
    for (let c = 0; c < BW; c++) {
      const h = hash(c, r, 200);
      let col = h > 0.86 ? P.pcb0 : h < 0.1 ? P.pcb2 : P.pcb1;
      if (c === 0) col = P.pcb3;
      else if (c === 1) col = h > 0.5 ? P.pcb3 : P.pcb2;
      else if (c >= 15) col = h > 0.5 ? P.pcb0 : P.pcb1;
      f.set(c, r, col);
    }
  // processeur : socket doré, cadre sombre, couvercle métallique
  for (let r = 6; r <= 21; r++)
    for (let c = 3; c <= 14; c++) {
      const edge = r === 6 || r === 21 || c === 3 || c === 14;
      f.set(c, r, edge ? P.cu2 : P.pcb0);
    }
  for (let r = 9; r <= 18; r++)
    for (let c = 5; c <= 12; c++) f.set(c, r, r === 9 ? P.st4 : r === 18 || c === 12 ? P.st2 : P.st3);
  f.set(3, 6, P.cu3);
  f.set(4, 6, P.cu3);
  for (let c = 4; c <= 15; c++) f.set(c, 22, P.pcb0);
  for (let c = 3; c <= 14; c++) if (c % 3 !== 2) f.set(c, 25, P.st3);
  // fentes de RAM, une vide, une avec sa barrette
  for (let r = 30; r <= 70; r++) {
    f.set(3, r, P.ink);
    f.set(4, r, P.ink);
    f.set(5, r, r % 2 ? P.cu2 : P.ink);
  }
  for (let c = 2; c <= 6; c++) {
    f.set(c, 29, c % 2 ? P.cu2 : P.cu1);
    f.set(c, 71, c % 2 ? P.cu2 : P.cu1);
  }
  for (let r = 33; r <= 67; r++) {
    f.set(10, r, P.ink);
    f.set(11, r, r % 2 ? P.cu2 : P.cu1);
    f.set(12, r, P.pcb3);
    f.set(13, r, P.pcb2);
    f.set(14, r, P.ink);
  }
  for (const r0 of [36, 44, 52, 60])
    for (let r = r0; r < r0 + 6; r++) {
      f.set(12, r, r === r0 ? P.st3 : P.st0);
      f.set(13, r, r === r0 ? P.st2 : P.st1);
    }
  for (let c = 9; c <= 15; c++) {
    f.set(c, 32, c % 2 ? P.cu2 : P.cu1);
    f.set(c, 68, c % 2 ? P.cu2 : P.cu1);
  }
  // condensateurs vus de dessus
  const cap = (cx: number, cy: number) => {
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > 5) continue;
        f.set(cx + dx, cy + dy, d2 >= 4 ? P.st4 : dx + dy < -1 ? P.st3 : P.st1);
      }
    f.set(cx, cy, P.st0);
  };
  for (const c of [4, 9, 14]) cap(c, 79);
  for (const c of [6, 12]) cap(c, 88);
  // bus de pistes en cuivre avec décrochements à 45°
  for (let k = 0; k < 5; k++) {
    const ck = 2 + k * 3;
    const jog = k % 2 ? 2 : -2;
    const pts: [number, number][] = [[ck, 98], [ck, 107], [ck + jog, 110], [ck + jog, 121], [ck, 124], [ck, 135]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= n; s++)
        trace(Math.round(lerp(x0, x1, s / n)), Math.round(lerp(y0, y1, s / n)), k % 2 ? P.cu2 : P.cu1);
    }
    for (const r of [98, 135]) {
      trace(ck, r, P.cu3);
      trace(ck - 1, r, P.cu2);
      trace(ck + 1, r, P.cu2);
    }
    const n = 13;
    for (let s = 0; s <= n; s++) trace(Math.round(lerp(ck, 8.5, s / n)), Math.round(lerp(136, 148, s / n)), P.cu1);
  }
  // vias dorés
  for (let r = 0; r < BL; r++)
    for (let c = 2; c < 15; c++)
      if (!TRACE[r * BW + c] && hash(c, r, 230) > 0.988) {
        f.set(c, r, P.cu2);
        f.set(c, r + 1, P.pcb0);
      }
  return f;
};
const BLADE = buildBlade();

// ---------------------------------------------------------------- épée
interface Pose {
  x: number;
  y: number;
  a: number;
}
const lerpPose = (p: Pose, q: Pose, k: number): Pose => ({x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), a: lerp(p.a, q.a, k)});

const A_IDLE = -68 * DEG;
const idlePose = (fr: number): Pose => {
  const t = fr / N;
  return {x: 40, y: 196 + 3 * Math.sin(TAU * 2 * t), a: A_IDLE + 0.025 * Math.sin(TAU * t + 1)};
};
const armedPose = (fr: number): Pose => {
  const p = idlePose(fr);
  return {x: p.x - 10, y: p.y + 8, a: p.a - 0.07};
};
const IMPACT: Pose = {x: CUT.x, y: CUT.y, a: TH};
const EXIT: Pose = {x: CUT.x + DN[0] * 170, y: CUT.y + DN[1] * 170, a: TH + 0.12};

const poseAt = (fr: number): Pose => {
  if (fr < 90) return idlePose(fr);
  if (fr < 99) return lerpPose(idlePose(fr), armedPose(fr), smooth((fr - 90) / 9));
  if (fr < 105) {
    const p = clamp((fr - 99) / 5);
    return lerpPose(armedPose(99), IMPACT, p * p);
  }
  if (fr < 108) return IMPACT;
  if (fr < 122) return lerpPose(IMPACT, EXIT, Math.pow((fr - 108) / 14, 1.7));
  if (fr < 195) return EXIT;
  if (fr < 262) return lerpPose(EXIT, idlePose(fr), smooth((fr - 195) / 67));
  return idlePose(fr);
};

const swordShade = (t: number) => {
  const pp = (t * 3 * BL) % BL;
  return (u: number, v: number): RGB | null => {
    if (u < 7.5) {
      const dx = u - 2;
      const d = Math.hypot(dx, v);
      if (d > 5.2) return null;
      if (d < 1.7) return Math.sin(TAU * 5 * t) > 0 ? P.cy3 : P.cy2;
      if (d > 4.2) return dx < 0 && v < 0 ? P.st4 : P.st3;
      return Math.abs(v) < 0.6 || Math.abs(dx) < 0.6 ? P.st2 : P.st1;
    }
    if (u < 30) {
      const fu = Math.floor(u);
      const ring = (((fu - 8) % 5) + 5) % 5 < 2;
      if (Math.abs(v) > (ring ? 4 : 3.5)) return null;
      if (ring) return fu % 2 ? P.cu2 : P.cu1;
      return v < -1.5 ? P.st2 : v < 1 ? P.st1 : P.st0;
    }
    if (u < 44) {
      const av = Math.abs(v);
      const umin = av > 13 ? 30 + (av - 13) : 30;
      const umax = av > 13 ? 44 - (av - 13) : 44;
      if (av > 18 || u < umin || u >= umax) return null;
      const d = Math.hypot(u - 37, v);
      if (d < 6.2) {
        if (d > 5.2) return P.st4;
        if (d < 1.8) return P.cy2;
        const a = Math.atan2(v, u - 37) - TAU * 6 * t;
        return Math.sin(5 * a) > 0 ? P.st2 : P.st0;
      }
      if (u >= 43) return Math.sin(TAU * (5 * t - v / 30)) > 0 ? P.cy2 : P.cy1;
      const m = (((Math.floor(v + 18)) % 5) + 5) % 5;
      if (m >= 3) return P.st0;
      return m === 0 ? P.st4 : m === 1 ? P.st3 : P.st2;
    }
    const r = Math.floor(u - 44);
    if (r < 0 || r >= BL) return null;
    const taper = r >= 125 ? (9 * (BL - r)) / 25 : 9;
    if (v >= taper) {
      if (v >= taper + 1.5) return null;
      const b = 0.5 + 0.5 * Math.sin(TAU * (5 * t - r / 45));
      return b > 0.66 ? P.cy3 : b > 0.25 ? P.cy2 : P.cy1;
    }
    if (v < -taper) {
      if (v >= -taper - 2 && r >= 6 && r <= 115) {
        const k = r % 4;
        if (k < 3) return k === 0 ? P.cu3 : P.cu2;
      }
      return null;
    }
    const c = Math.min(BW - 1, Math.max(0, Math.floor(v + 9)));
    if (TRACE[r * BW + c] && Math.abs(r - pp) < 4) return Math.abs(r - pp) < 2 ? P.cy3 : P.cy2;
    return BLADE.get(c, r);
  };
};

const drawSword = (f: Frame, pose: Pose, t: number, ghost = 0) => {
  const sh = swordShade(t);
  if (ghost > 0) {
    orient(
      (x, y) => f.blend(x, y, P.cy2, ghost),
      pose.x, pose.y, pose.a, -99, 100, 18.5,
      (u, v) => (sh(u + 95, v) ? P.cy2 : null),
    );
    return;
  }
  orient((x, y, c) => f.set(x, y, c), pose.x, pose.y, pose.a, -99, 100, 18.5, (u, v) => sh(u + 95, v));
  // halo du tranchant
  const ca = Math.cos(pose.a);
  const sa = Math.sin(pose.a);
  for (let u = 52; u <= 190; u += 3) {
    const flick = 0.7 + 0.3 * Math.sin(TAU * (5 * t - u / 40));
    const lu = u - 95;
    f.glow(pose.x + lu * ca + 10.5 * -sa, pose.y + lu * sa + 10.5 * ca, 5, P.cy1, 0.2 * flick);
  }
};

// ---------------------------------------------------------------- robot
interface RobotState {
  fr: number;
  eye: number;
  phi: number;
  phiR: number;
}

const lightDot = (nx: number, ny: number, nz: number) => nx * -0.6 + ny * -0.5 + nz * 0.62;

const drawRobot = (L: Layer, cx: number, fy: number, st: RobotState): {eyeX: number; eyeY: number} => {
  L.clear();
  const t = st.fr / N;
  const put = (x: number, y: number, c: RGB) => L.set(x, y, c);
  const plate = (x0: number, y0: number, w: number, h: number, o: {ch?: number; l0?: number; l1?: number; lines?: number} = {}) => {
    const ch = o.ch ?? 2;
    const l0 = o.l0 ?? 0.85;
    const l1 = o.l1 ?? 0.2;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (x + y < ch || w - 1 - x + y < ch || x + h - 1 - y < ch || w - 1 - x + h - 1 - y < ch) continue;
        let l = lerp(l0, l1, x / (w - 1));
        if (y === 0) l += 0.22;
        else if (y === h - 1) l -= 0.22;
        if (hash(x0 + x, y0 + y, 31) > 0.93) l -= 0.1;
        if (o.lines && y % o.lines === o.lines - 1 && y < h - 1) l -= 0.18;
        let c = steel(l);
        if (x === 0 && l > 0.6) c = mix(c, P.cy2, 0.35);
        put(cx + x0 + x, fy + y0 + y, c);
      }
  };
  const ball = (ox: number, oy: number, r: number) => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > r * r) continue;
        const nx = dx / r;
        const ny = dy / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        put(cx + ox + dx, fy + oy + dy, steel(lightDot(nx, ny, nz) * 0.9 + 0.15));
      }
  };
  const limb = (sx: number, sy: number, ang: number, len: number, vh: number, taper = false) => {
    const nvx = -Math.sin(ang);
    const nvy = Math.cos(ang);
    orient(put, cx + sx, fy + sy, ang, 0, len, vh, (u, v) => {
      const hw = taper ? vh * Math.pow(1 - u / len, 0.6) : vh;
      if (Math.abs(v) > hw) return null;
      const k = clamp(v / vh, -1, 1);
      const nz = Math.sqrt(Math.max(0, 1 - k * k));
      return steel(lightDot(k * nvx, k * nvy, nz) * 0.9 + 0.15);
    });
  };

  // jambes
  for (const sx of [-1, 1]) {
    plate(sx < 0 ? -23 : 7, -7, 16, 7, {ch: 2});
    plate(sx < 0 ? -21 : 9, -34, 12, 27, {lines: 9});
    for (let y = -32; y < -12; y++) put(cx + sx * 15, fy + y, y % 2 ? P.st4 : P.st2);
    ball(sx * 15, -36, 6);
    plate(sx < 0 ? -22 : 8, -58, 14, 21, {lines: 7});
  }
  plate(-27, -68, 54, 11, {ch: 2, lines: 5});
  // torse
  plate(-30, -108, 60, 40, {ch: 4});
  for (let k = 0; k < 5; k++) {
    const y = -100 + k * 3;
    for (let x = -12; x <= 12; x++) {
      put(cx + x, fy + y, P.ink);
      put(cx + x, fy + y + 1, x < 0 ? P.st2 : P.st1);
    }
  }
  for (let y = -66 - 40; y < -68; y++) put(cx, fy + y, P.st1);
  // noyau énergétique
  const core = st.eye;
  for (let dy = -4; dy <= 4; dy++)
    for (let dx = -4; dx <= 4; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > 4.3) continue;
      put(cx + dx, fy - 78 + dy, d > 3.3 ? P.st4 : d > 1.6 ? P.st1 : core > 0.8 ? P.hot2 : core > 0.35 ? P.hot1 : P.hot0);
    }
  if (core > 0.8) put(cx, fy - 78, P.hot3);
  // pistons d'épaules et épaules
  plate(-36, -113, 6, 11, {ch: 1});
  plate(30, -113, 6, 11, {ch: 1});
  ball(-37, -98, 8);
  ball(37, -98, 8);
  // bras gauche (côté épée) : biceps, coude, avant-bras lame
  const elbowL = [-41, -77];
  limb(-37, -98, Math.atan2(elbowL[1] + 98, elbowL[0] + 37), 22, 4.5);
  ball(elbowL[0], elbowL[1], 5);
  limb(elbowL[0], elbowL[1], st.phi, 12, 5);
  const bx = elbowL[0] + Math.cos(st.phi) * 12;
  const by = elbowL[1] + Math.sin(st.phi) * 12;
  limb(bx, by, st.phi, 30, 4, true);
  // bras droit
  const elbowR = [41, -77];
  limb(37, -98, Math.atan2(elbowR[1] + 98, elbowR[0] - 37), 22, 4.5);
  ball(elbowR[0], elbowR[1], 5);
  limb(elbowR[0], elbowR[1], st.phiR, 12, 5);
  limb(elbowR[0] + Math.cos(st.phiR) * 12, elbowR[1] + Math.sin(st.phiR) * 12, st.phiR, 24, 4, true);
  // tête
  plate(-5, -112, 10, 5, {ch: 0});
  plate(-14, -128, 28, 17, {ch: 3, l0: 0.9, l1: 0.25});
  for (let y = -122; y <= -117; y++) for (let x = -10; x <= 10; x++) put(cx + x, fy + y, P.ink);
  const awake = st.eye > 0.05;
  const eyeX = awake && st.fr >= 60 && st.fr < FR_HIT ? Math.round(3 * Math.sin((TAU * (st.fr - 60)) / 60)) : 0;
  if (awake) {
    const e = st.eye;
    for (let dx = -3; dx <= 2; dx++) {
      put(cx + eyeX + dx, fy - 121, e > 0.8 ? P.hot1 : P.hot0);
      put(cx + eyeX + dx, fy - 120, e > 0.8 ? (Math.abs(dx + 0.5) < 1.5 ? P.hot3 : P.hot2) : e > 0.35 ? P.hot1 : P.hot0);
      put(cx + eyeX + dx, fy - 119, e > 0.8 ? P.hot1 : P.hot0);
    }
  } else put(cx, fy - 120, P.hot0);
  // antenne
  for (let y = -140; y < -128; y++) put(cx + 9, fy + y, y % 3 ? P.st2 : P.st3);
  put(cx + 9, fy - 141, Math.sin(TAU * 5 * t) > 0.4 ? P.hot2 : P.hot0);
  return {eyeX: cx + eyeX, eyeY: fy - 120};
};

// ---------------------------------------------------------------- état de la coupe
interface CutState {
  slide: number;
  gap: number;
  w: number;
  I: number;
  offA: [number, number];
  offB: [number, number];
}

const cutState = (fr: number): CutState | null => {
  if (fr < FR_HIT || fr >= 261) return null;
  const slide = 22 * eo3((fr - 108) / 40) + 12 * clamp((fr - 148) / 47);
  const gap = 1.5 + 7.5 * eo3((fr - 108) / 30);
  const drop = Math.round(3 * eo3((fr - 108) / 20));
  const I = fr < 150 ? 1 : Math.max(0.15, 1 - smooth((fr - 150) / 55));
  return {
    slide,
    gap,
    w: 2 + 3.5 * smooth((fr - 106) / 40),
    I,
    offA: [Math.round(DD[0] * slide - (DN[0] * gap) / 2), Math.round(DD[1] * slide - (DN[1] * gap) / 2)],
    offB: [Math.round((DN[0] * gap) / 2), Math.round((DN[1] * gap) / 2) + drop],
  };
};

const sideOf = (x: number, y: number) => (x - CUT.x) * DN[0] + (y - CUT.y) * DN[1];

const composeRobot = (f: Frame, L: Layer, fr: number, cs: CutState | null, mp: number | null) => {
  const cover = new Uint8Array(W * H);
  const ys = 108 + (mp ?? 0) * 145;
  L.each((x, y, r, g, b) => {
    let c: RGB = [r, g, b];
    let x2 = x;
    let y2 = y;
    if (cs) {
      const sv = sideOf(x, y);
      const dist = Math.abs(sv);
      const off = sv < 0 ? cs.offA : cs.offB;
      x2 = x + off[0];
      y2 = y + off[1];
      if (dist < cs.w) {
        const d = dist / cs.w;
        const k = cs.I * (1 - d);
        if (k > 0) c = mix(c, ramp(HEAT, d), clamp(k * 1.4));
      }
      const thr = 0.2 + 0.55 * clamp((y - 124) / 126) + 0.25 * hash(x, y, 3);
      const fd = 195 + 62 * thr;
      if (fr >= fd) {
        const tau = fr - fd;
        if (tau < 18) {
          const k = tau / 18;
          const dx = Math.round(Math.sin(tau * 0.7 + hash(x, y, 4) * 6) * 1.5);
          f.blend(x2 + dx, y2 - Math.round(tau * 0.9), mix(c, P.cy2, k), 1 - k);
        }
        return;
      }
    } else if (mp !== null) {
      if (y > ys) return;
      const dy = ys - y;
      if (dy < 6) c = mix(c, P.cy2, 0.55 * (1 - dy / 6));
      if (dy < 9 && y % 2) x2 += 1;
    }
    f.set(x2, y2, c);
    if (x2 >= 0 && x2 < W && y2 >= 0 && y2 < H) cover[y2 * W + x2] = 1;
    if (y2 <= FLOOR_Y + 1) {
      const ry = Math.round(FLOOR_Y + (FLOOR_Y - y2) * 0.55);
      if (ry < H) f.blend(x2, ry, mix(c, P.cy0, 0.5), 0.12);
    }
  });
  if (mp !== null && mp > 0 && mp < 1) {
    for (let x = 40; x < 170; x++) f.add(x, Math.round(ys), P.cy3, 0.85);
    f.glow(106, FLOOR_Y, 30, P.cy1, 0.25 * mp);
  }
  if (!cs) return;
  const fade = 1 - smooth((fr - 190) / 45);
  if (fade <= 0.02) return;
  // interstice incandescent entre les deux moitiés
  const half = Math.min(cs.gap / 2, 1.2) + 0.8;
  L.each((x, y) => {
    const dist = Math.abs(sideOf(x, y));
    if (dist >= half || cover[y * W + x]) return;
    const fl = 0.85 + 0.15 * Math.sin(fr * 1.7 + x * 0.9);
    const c = ramp([[0, P.hot3], [0.5, P.hot2], [1, P.hot1]], dist / half);
    f.set(x, y, mix(P.hs0, c, clamp((0.35 + 0.65 * cs.I) * fl * fade)));
  });
  // lumière de la coupe sur ce qui l'entoure
  for (let l = -34; l <= 34; l += 7) {
    const px = CUT.x + DD[0] * l;
    const py = CUT.y + DD[1] * l;
    if (L.has(px, py)) f.glow(px, py, 12, P.hot1, 0.17 * cs.I * fade);
  }
  // câbles qui jaillissent et se rompent
  const wires = [P.cu2, P.cy2, P.hot2, P.cu1, P.cy1, P.cu2];
  for (let k = 0; k < 6; k++) {
    const l = -26 + k * 10;
    const px = CUT.x + DD[0] * l;
    const py = CUT.y + DD[1] * l;
    if (!L.has(px, py)) continue;
    const ax = px - (DN[0] * cs.gap) / 2 + cs.offA[0];
    const ay = py - (DN[1] * cs.gap) / 2 + cs.offA[1];
    const bx = px + cs.offB[0];
    const by = py + cs.offB[1];
    const len = Math.hypot(ax - bx, ay - by);
    const limit = 10 + 2.5 * k;
    if (len > limit || fade < 0.5) continue;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2 + 3 * (1 - len / limit);
    f.line(ax, ay, mx, my, wires[k]);
    f.line(mx, my, bx, by, wires[k]);
  }
};

// ---------------------------------------------------------------- décor
const hexDist = (x: number, y: number, s: number) => {
  const a = s * 1.7320508;
  const b = s * 1.5;
  const ax = ((x % a) + a) % a - a / 2;
  const ay = ((y % (2 * b)) + 2 * b) % (2 * b) - b;
  const bx = (((x + a / 2) % a) + a) % a - a / 2;
  const by = (((y + b) % (2 * b)) + 2 * b) % (2 * b) - b;
  const m = (px: number, py: number) => Math.max(Math.abs(py), Math.abs(px) * 0.8660254 + Math.abs(py) * 0.5) / s;
  return Math.min(m(ax, ay), m(bx, by));
};

const BG: [number, RGB][] = [[0, P.ink], [0.3, P.bg1], [0.65, P.bg2], [1, P.bg3]];

const background = (f: Frame, t: number, ox: number) => {
  for (let y = 0; y < 250; y++) {
    const base = ramp(BG, y / 250);
    for (let x = 0; x < W; x++) {
      let c = base;
      const hd = hexDist(x + ox, y, 11);
      if (hd > 0.9) c = mix(c, P.bg3, 0.55 * (1 - y / 240));
      // deux faisceaux de lumière froide venus du plafond
      const s1 = Math.exp(-(((x - (28 + y * 0.45)) / 9) ** 2)) * 0.1 * (1 - y / 250);
      const s2 = Math.exp(-(((x - (120 + y * 0.3)) / 14) ** 2)) * 0.07 * (1 - y / 250);
      if (s1 + s2 > 0.005) c = mix(c, P.bg5, s1 + s2);
      f.set(x, y, c);
    }
  }
};

const racks = (f: Frame, t: number, ox: number) => {
  const cw = 17;
  for (let i = -1; i < Math.ceil(W / cw) + 2; i++) {
    const x0 = Math.round(i * cw + ox);
    const top = 104 + Math.floor(hash(i, 1, 5) * 46);
    const tint = hash(i, 2, 5);
    for (let y = top; y < 250; y++)
      for (let x = 0; x < 15; x++) {
        const px = x0 + x;
        if (px < 0 || px >= W) continue;
        let c = mix(P.bg3, P.bg4, tint * 0.6);
        if ((y - top) % 5 === 3) c = P.bg2;
        if (x === 0 || y === top) c = P.bg5;
        else if (x === 14) c = P.bg2;
        f.set(px, y, mix(c, P.bg4, 0.18));
      }
    for (let row = 0; row < 12; row++) {
      const y = top + 3 + row * 5;
      if (y >= 246) break;
      for (let k = 0; k < 3; k++) {
        const h = hash(i * 7 + k, row, 6);
        const on = Math.sin(TAU * ((1 + Math.floor(h * 4)) * t + h * 7)) > 0.2;
        const px = x0 + 3 + k * 4;
        f.set(px, y, on ? (h > 0.97 ? P.hot1 : h > 0.55 ? P.cy2 : P.pcb3) : P.bg2);
      }
    }
  }
};

const rackWall = (f: Frame, t: number, ox: number) => {
  const x0 = 156 + Math.round(ox);
  for (let y = 46; y < 252; y++)
    for (let x = x0; x < W; x++) {
      if (x < 0) continue;
      let c: RGB = (y - 46) % 6 === 5 ? P.ink : P.bg1;
      if (x === x0) c = P.cy0;
      else if (x === x0 + 1) c = P.bg3;
      f.set(x, y, c);
    }
  for (let row = 0; row < 30; row++) {
    const y = 50 + row * 6;
    if (y > 246) break;
    for (let k = 0; k < 4; k++) {
      const h = hash(k, row, 8);
      const on = Math.sin(TAU * ((1 + Math.floor(h * 3)) * t + h * 5)) > 0;
      f.set(x0 + 5 + k * 5, y, on ? (h > 0.9 ? P.hot1 : h > 0.5 ? P.cy2 : P.pcb3) : P.bg3);
    }
  }
};

const catwalk = (f: Frame, t: number, ox: number) => {
  const o = Math.round(ox);
  for (let x = 0; x < W; x++) {
    for (let y = 198; y <= 203; y++) f.set(x, y, y === 198 ? P.bg4 : y === 203 ? P.ink : P.bg1);
    f.set(x, 214, P.bg5);
    for (let y = 215; y <= 217; y++) f.set(x, y, y === 217 ? P.ink : P.bg1);
    f.set(x, 196, P.ink);
    f.set(x, 206, P.ink);
  }
  for (let x = -40; x < W + 40; x += 12) {
    const px = x + (o % 12);
    for (let y = 196; y < 214; y++) f.set(px, y, P.ink);
  }
  for (let x = -48; x < W + 48; x += 24) {
    const px = x + (o % 24);
    f.line(px, 218, px + 24, 249, P.bg2);
    f.line(px + 24, 218, px, 249, P.bg2);
  }
  for (let x = -20; x < W + 20; x += 40) for (let y = 203; y < 250; y++) f.set(x + (o % 40), y, P.ink);
};

const floorPlane = (f: Frame, t: number) => {
  for (let y = FLOOR_Y; y < H; y++) {
    const base = mix(P.bg2, P.ink, ((y - FLOOR_Y) / 70) * 0.85);
    for (let x = 0; x < W; x++) f.set(x, y, base);
  }
  for (const y of [251, 255, 260, 266, 273, 282, 293, 306])
    for (let x = 0; x < W; x++) f.blend(x, y, P.bg4, 0.5 - (y - 250) / 180);
  const vx = 96;
  const vy = 205;
  for (let xe = -300; xe <= 480; xe += 34)
    for (let y = 252; y < H; y++) {
      const x = Math.round(vx + ((xe - vx) * (y - vy)) / (320 - vy));
      f.blend(x, y, P.bg4, 0.35);
    }
  for (let x = 0; x < W; x++) f.blend(x, FLOOR_Y, P.bg5, 0.5);
  // brume froide au ras du sol
  for (let y = 226; y < 262; y++) {
    const bell = Math.sin((Math.PI * (y - 226)) / 36);
    for (let x = 0; x < W; x++) {
      const n = fbm(x * 0.03 + t * 6, y * 0.1, 3, 61, 6, 0);
      f.blend(x, y, P.bg5, clamp(n * 1.7 - 0.45) * bell * 0.5);
    }
  }
};

const cable = (f: Frame, x0: number, len: number, phase: number, t: number, ox: number) => {
  for (let y = 0; y < len; y++) {
    const sway = 3 * Math.sin(TAU * (t + phase)) * (y / len) * (y / len);
    const x = Math.round(x0 + ox + sway);
    f.set(x - 1, y, P.st1);
    f.set(x, y, P.ink);
    f.set(x + 1, y, P.ink);
    f.set(x + 2, y, P.bg1);
  }
  const sway = 3 * Math.sin(TAU * (t + phase));
  const x = Math.round(x0 + ox + sway);
  f.rect(x - 2, len, 6, 5, P.st0);
  f.rect(x - 2, len, 6, 1, P.st2);
  for (let k = 0; k < 3; k++) f.set(x - 1 + k * 2, len + 5, P.cu2);
};

// ---------------------------------------------------------------- effets
const sparks = (f: Frame, fr: number, L: Layer, cs: CutState | null) => {
  if (fr < 108 || fr >= 200) return;
  const T = fr - 108;
  for (let i = 0; i < 48; i++) {
    const delay = Math.floor(hash(i, 4, 400) * 4);
    const life = 18 + Math.floor(26 * hash(i, 3, 400));
    const tau = T - delay;
    if (tau < 0 || tau >= life) continue;
    const ang = hash(i, 1, 400) * TAU;
    const sp = 2 + 4 * hash(i, 2, 400);
    const pos = (s: number) => {
      const d = 10 * sp * (1 - Math.pow(0.9, s));
      return [CUT.x + Math.cos(ang) * d, CUT.y + Math.sin(ang) * d + 0.06 * s * s];
    };
    const [x, y] = pos(tau);
    const [px, py] = pos(tau - 1);
    const c = ramp(SPARK, tau / life);
    f.line(px, py, x, y, c);
    f.set(x, y, tau < life * 0.3 ? P.hot3 : c);
  }
  if (!cs) return;
  for (let j = 0; j < 36; j++) {
    const start = 110 + Math.floor(hash(j, 1, 410) * 80);
    const life = 16 + Math.floor(10 * hash(j, 2, 410));
    const tau = fr - start;
    if (tau < 0 || tau >= life) continue;
    const l = (hash(j, 3, 410) - 0.5) * 60;
    const ox = CUT.x + DD[0] * l;
    const oy = CUT.y + DD[1] * l;
    if (!L.has(ox, oy)) continue;
    const vn = 1.2 + 1.5 * hash(j, 4, 410);
    const vd = (hash(j, 5, 410) - 0.5) * 1.5;
    const pos = (s: number): [number, number] => [
      ox + cs.offB[0] - DN[0] * vn * s + DD[0] * vd * s,
      oy + cs.offB[1] - DN[1] * vn * s + DD[1] * vd * s + 0.1 * s * s,
    ];
    const [x, y] = pos(tau);
    const [px, py] = pos(tau - 1);
    const c = ramp(SPARK, (tau / life) * 0.9);
    f.line(px, py, x, y, c);
  }
};

const shockwave = (f: Frame, fr: number) => {
  if (fr < FR_HIT || fr >= FR_HIT + 22) return;
  const k = (fr - FR_HIT) / 22;
  for (const [mul, col, a] of [[1, P.cy3, 1], [0.7, P.hot2, 0.8]] as [number, RGB, number][]) {
    const r = 3 + (fr - FR_HIT) * 2.6 * mul;
    const n = Math.ceil(r * 8);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU;
      f.add(CUT.x + Math.cos(ang) * r, CUT.y + Math.sin(ang) * r, col, (1 - k) * a);
      f.add(CUT.x + Math.cos(ang) * (r + 1), CUT.y + Math.sin(ang) * (r + 1), col, (1 - k) * a * 0.6);
    }
  }
};

const dust = (f: Frame, t: number) => {
  for (let i = 0; i < 34; i++) {
    const k = 1 + (i % 2);
    const y = (((hash(i, 1, 600) * H - t * H * k) % H) + H) % H;
    const x = hash(i, 2, 600) * W + 5 * Math.sin(TAU * (t * 2 + hash(i, 3, 600)));
    const big = hash(i, 4, 600) > 0.8;
    f.blend(x, y, big ? P.cy2 : P.cy1, big ? 0.7 : 0.55);
    if (big) f.blend(x + 1, y, P.cy2, 0.4);
  }
};

const alarm = (f: Frame, fr: number) => {
  if (fr < 112 || fr > 140) return;
  if (((fr - 112) >> 2) % 2 !== 0) return;
  f.rect(31, 150, 2, 2, P.hot2);
  f.glow(32, 151, 9, P.hot1, 0.6);
};

const vignette = (f: Frame) => {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2);
      const dy = (y - H * 0.55) / (H / 2);
      f.mul(x, y, 1 - 0.34 * clamp(dx * dx * 0.7 + dy * dy * 0.6 - 0.25));
    }
};

const title = (f: Frame) => {
  const outline = P.ink;
  drawTextCentered(f, "L'ÉPÉE", W / 2, 46, {size: 1, color: P.hot3, outline});
  drawTextCentered(f, 'CARTE MÈRE', W / 2, 62, {size: 2, color: P.cy2, outline, shadow: P.ink});
  drawTextCentered(f, 'TRANCHE TOUT', W / 2, 82, {size: 2, color: P.hot1, outline, shadow: P.ink});
};

// ---------------------------------------------------------------- image
const LAYER = new Layer(W, H);

const render = (frame: number, opts: SceneOptions = {}): Frame => {
  const fr = ((frame % N) + N) % N;
  const t = fr / N;
  let f = new Frame(W, H);
  const camX = 5 * Math.sin(TAU * t);

  background(f, t, -0.8 * camX);
  racks(f, t, -0.8 * camX);
  rackWall(f, t, -0.4 * camX);
  catwalk(f, t, -0.5 * camX);
  floorPlane(f, t);
  alarm(f, fr);

  // robot
  const cx = fr < 45 ? 106 : fr < 90 ? 106 - 10 * smooth((fr - 45) / 45) : fr < 261 ? 96 : 106;
  const bob = fr >= 45 && fr < 90 ? Math.round(1.5 * Math.abs(Math.sin((TAU * (fr - 45)) / 22.5))) : 0;
  const fy = FLOOR_Y - bob;
  let eye = 0;
  if (fr >= 261) eye = 0;
  else if (fr >= FR_HIT) eye = clamp(1 - (fr - 110) / 85) * (0.65 + 0.35 * hash(fr, 9, 0));
  else if (fr >= 60) eye = 1;
  else if (fr >= 45) eye = hash(fr, 7, 0) > 0.45 ? 1 : 0.35;
  const phi =
    fr >= 261 || fr < 60 ? 90 * DEG
    : fr < 90 ? lerp(90, -125, smooth((fr - 60) / 30)) * DEG
    : fr < 108 ? -125 * DEG
    : lerp(-125, -95, smooth((fr - 108) / 50)) * DEG;
  const eyePos = drawRobot(LAYER, Math.round(cx), fy, {fr, eye, phi, phiR: 82 * DEG});

  for (let y = FLOOR_Y - 4; y <= FLOOR_Y + 8; y++)
    for (let x = Math.round(cx) - 36; x <= Math.round(cx) + 36; x++) {
      const d = ((x - cx) / 36) ** 2 + ((y - (FLOOR_Y + 2)) / 6) ** 2;
      if (d < 1 && fr < 240) f.mul(x, y, 1 - 0.5 * (1 - d));
    }
  const cs = cutState(fr);
  const mp = fr >= 261 ? (fr - 261) / 39 : null;
  composeRobot(f, LAYER, fr, cs, mp);
  if (eye > 0.05) {
    const o = cs ? cs.offA : [0, 0];
    f.glow(eyePos.eyeX + o[0], eyePos.eyeY + o[1], 10, P.hot1, 0.4 * eye);
  }
  sparks(f, fr, LAYER, cs);
  shockwave(f, fr);

  // épée et traînée du coup
  if (fr >= 99 && fr < 130) {
    const alphas = [0.4, 0.26, 0.16, 0.08];
    for (let k = alphas.length; k >= 1; k--) drawSword(f, poseAt(fr - k * 1), t, alphas[k - 1]);
  }
  drawSword(f, poseAt(fr), t);

  cable(f, 10, 118, 0.0, t, 0.9 * camX);
  cable(f, 24, 70, 0.3, t, 0.9 * camX);
  cable(f, 3, 150, 0.6, t, 0.9 * camX);
  cable(f, 150, 56, 0.15, t, 0.9 * camX);
  dust(f, t);
  vignette(f);

  // tremblement de caméra
  if (fr >= FR_HIT && fr < FR_HIT + 9) {
    const amp = 3 * (1 - (fr - FR_HIT) / 9);
    f = shifted(f, Math.round(amp * (hash(fr, 1, 500) * 2 - 1)), Math.round(amp * (hash(fr, 2, 500) * 2 - 1)));
  }
  // flash blanc
  if (fr >= FR_HIT && fr < FR_HIT + 3) {
    const a = [0.75, 0.4, 0.18][fr - FR_HIT];
    const col = fr === FR_HIT ? P.hot3 : P.cy3;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) f.blend(x, y, col, a);
  }
  if (opts.text !== false) title(f);
  return f;
};

export const epeeCarteMere: Scene = {
  id: 'epee-carte-mere',
  title: 'L’épée carte mère',
  width: W,
  height: H,
  scale: 6,
  fps: 30,
  durationInFrames: N,
  palette: Object.values(P),
  dither: 1,
  render,
};
