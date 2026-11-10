// Scène de démonstration : un observatoire de montagne sous une aurore.
// Brief complet dans briefs/observatoire.md — le code suit le brief plan par plan.

import {
  Frame, RGB, Scene, SceneOptions, clamp, drawTextCentered, fbm, hash, hex, mix, noise2, ramp, scale, smooth,
} from '../engine';

const W = 180;
const H = 320;
const N = 300; // 10 s à 30 i/s, boucle parfaite
const TAU = Math.PI * 2;

// Palette « nuit boréale » : 5 rampes courtes, 29 couleurs.
const P = {
  ink: hex('#05060f'),
  night1: hex('#0a0d1f'),
  night2: hex('#10163a'),
  night3: hex('#172052'),
  night4: hex('#1f2d6b'),
  night5: hex('#2a3f86'),
  night6: hex('#3856a0'),
  teal1: hex('#0e3a45'),
  teal2: hex('#13595a'),
  teal3: hex('#1c8a6e'),
  green1: hex('#3fc380'),
  green2: hex('#8cf0a0'),
  green3: hex('#d6ffc9'),
  violet1: hex('#2b1d4f'),
  violet2: hex('#4a2f7a'),
  violet3: hex('#7a4fa8'),
  snow1: hex('#5f7aa8'),
  snow2: hex('#8fa9cf'),
  snow3: hex('#c6d8ef'),
  white: hex('#f4f8ff'),
  dusk: hex('#a8785a'),
  warm0: hex('#3a1c12'),
  warm1: hex('#7a3415'),
  warm2: hex('#c4601a'),
  warm3: hex('#f2a22e'),
  warm4: hex('#ffd97a'),
  warm5: hex('#fff3c4'),
  red: hex('#d43a3a'),
};

const SKY: [number, RGB][] = [
  [0, P.ink],
  [0.22, P.night1],
  [0.45, P.night2],
  [0.6, P.night3],
  [0.7, P.night4],
  [0.78, mix(P.night5, P.teal2, 0.35)],
];

const AURORA: [number, RGB][] = [
  [0, P.green2],
  [0.18, P.green1],
  [0.5, P.teal3],
  [0.8, P.violet2],
  [1, P.violet1],
];

const DOME: [number, RGB][] = [
  [0, P.night2],
  [0.3, P.night4],
  [0.55, P.snow1],
  [0.8, P.snow3],
  [1, P.white],
];

const WALL: [number, RGB][] = [
  [0, P.snow2],
  [0.14, P.snow1],
  [0.42, P.night6],
  [0.72, P.night4],
  [1, P.night3],
];

const farRidge = (sx: number) =>
  208 - 58 * fbm(sx * 0.016 + 5, 0.5, 4, 21) - 20 * Math.max(0, 1 - Math.abs(sx - 44) / 38);

const midRidge = (sx: number) => {
  const cell = Math.floor(sx / 5);
  const u = sx - cell * 5;
  const spike = (1 - Math.abs(u - 2.5) / 2.5) * (2 + 5 * hash(cell, 0, 7));
  return 240 - 26 * fbm(sx * 0.03 + 9, 1.5, 3, 33) - spike;
};

const hillY = (sx: number) => 282 - 32 * Math.exp(-(((sx - 112) / 58) ** 2)) - 5 * fbm(sx * 0.05, 3.3, 2, 51);

function sky(f: Frame, t: number) {
  for (let y = 0; y < 260; y++) {
    const base = ramp(SKY, y / H);
    for (let x = 0; x < W; x++) {
      // voie lactée : bande diagonale texturée
      const d = (x * 0.6 + y - 150) / 34;
      const mw = Math.exp(-d * d) * smooth(fbm(x * 0.07 + 3, y * 0.07, 4, 11) * 1.6 - 0.35);
      f.set(x, y, mw > 0.01 ? mix(base, P.violet3, mw * 0.42) : base);
    }
  }
  // étoiles : une par cellule au plus, scintillement sur un nombre entier de cycles (boucle)
  for (let cy = 0; cy < 44; cy++)
    for (let cx = 0; cx < 30; cx++) {
      const h1 = hash(cx, cy, 101);
      if (h1 > 0.42) continue;
      const x = cx * 6 + Math.floor(hash(cx, cy, 102) * 6);
      const y = cy * 6 + Math.floor(hash(cx, cy, 103) * 6);
      const mag = hash(cx, cy, 104);
      const cycles = 1 + Math.floor(hash(cx, cy, 105) * 4);
      const tw = 0.55 + 0.45 * Math.sin(TAU * (t * cycles + hash(cx, cy, 106)));
      const b = (0.25 + 0.75 * mag * mag) * tw;
      const col = mag > 0.8 ? P.white : mag > 0.5 ? P.snow3 : P.snow2;
      f.add(x, y, col, b);
      if (mag > 0.9) {
        // les plus brillantes : petite croix
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) f.add(x + dx, y + dy, P.snow2, b * 0.55);
      }
    }
}

function aurora(f: Frame, t: number) {
  const curtain = (seed: number, yBase: number, power: number, speed: number) => {
    for (let x = 0; x < W; x++) {
      const y0 =
        yBase +
        22 * Math.sin(x * 0.034 + TAU * t * speed + seed) +
        9 * Math.sin(x * 0.085 - TAU * t * 2 * speed + seed * 2.1);
      const band = smooth(noise2(x * 0.04, t * 4, seed, 0, 4) * 1.7 - 0.3);
      const streak = 0.55 + 0.45 * noise2(x * 0.75, t * 6, seed + 1, 0, 6);
      const height = 55 + 45 * noise2(x * 0.06, t * 3, seed + 2, 0, 3);
      const k = band * streak * power;
      if (k < 0.02) continue;
      for (let y = Math.floor(y0 - height); y < y0 + 5; y++) {
        const v = (y0 - y) / height; // 0 en bas du rideau, 1 en haut
        const a = v >= 0 ? Math.pow(Math.max(0, 1 - v), 1.6) : Math.max(0, 1 + v * 0.25 * height);
        f.add(x, y, ramp(AURORA, clamp(v)), a * k);
      }
    }
  };
  curtain(3, 150, 0.5, -1);
  curtain(8, 118, 0.85, 1);
}

function shootingStar(f: Frame, frame: number) {
  const start = 168;
  const len = 16;
  const p = (frame - start) / len;
  if (p < 0 || p > 1) return;
  for (let i = 0; i < 14; i++) {
    const q = p - i * 0.022;
    if (q < 0) break;
    const x = 174 - 58 * q;
    const y = 104 + 30 * q;
    f.add(x, y, i === 0 ? P.white : P.snow3, (1 - i / 14) * Math.sin(Math.PI * p));
  }
}

function mountains(f: Frame, t: number, camX: number) {
  // plan lointain : clair, bleuté, neige en altitude éclairée par la gauche
  for (let x = 0; x < W; x++) {
    const sx = x + camX * 0.2;
    const r = farRidge(sx);
    const slope = (farRidge(sx + 3) - farRidge(sx - 3)) / 6;
    const lit = smooth(0.5 - slope * 1.4);
    for (let y = Math.floor(r); y < 262; y++) {
      const d = y - r;
      const n = noise2(sx * 0.09, y * 0.09, 5);
      const snow = smooth((197 + 22 * (n - 0.5) - y) / 9) * (noise2(sx * 0.28 + y * 0.22, y * 0.3, 6) > 0.72 ? 0.25 : 1);
      const rock = mix(P.night3, P.night5, lit * 0.55);
      const white = mix(mix(P.night6, P.snow1, 0.4), mix(P.snow2, P.green2, 0.1), lit);
      let c = mix(rock, white, snow);
      if (d < 1) c = mix(c, P.snow3, lit * 0.8); // liseré de crête
      f.set(x, y, mix(c, P.night5, clamp((y - 205) / 55) * 0.8));
    }
  }
  // brume entre les plans : dérive d'exactement une période sur la boucle
  const fog = (y0: number, y1: number, seed: number, strength: number, dir: number) => {
    for (let y = y0; y < y1; y++) {
      const bell = Math.sin((Math.PI * (y - y0)) / (y1 - y0));
      for (let x = 0; x < W; x++) {
        const n = fbm(x * 0.028 + dir * t * 6, y * 0.09, 3, seed, 6, 0);
        f.blend(x, y, P.snow1, smooth(n * 1.8 - 0.45) * bell * strength);
      }
    }
  };
  fog(205, 250, 61, 0.75, 1);
  // plan intermédiaire : crête de sapins en silhouette
  for (let x = 0; x < W; x++) {
    const sx = x + camX * 0.55;
    const r = midRidge(sx);
    for (let y = Math.floor(r); y < H; y++) {
      const d = y - r;
      f.set(x, y, d < 1.5 ? mix(P.night2, P.teal1, 0.6) : mix(P.night1, P.night2, clamp(d / 40)));
    }
  }
  fog(240, 282, 73, 0.5, -1);
}

function observatory(f: Frame, bx: number, by: number, t: number) {
  const bw = 34;
  const bh = 30;
  const x0 = bx - bw / 2;
  const top = by - bh;

  // mât et balise
  const mx = bx + 24;
  for (let y = by - 36; y <= by; y++) f.set(mx, y, y % 6 < 3 ? P.night2 : P.night1);
  f.line(mx, by - 30, mx - 5, by - 4, P.night1);
  const blink = Math.sin(TAU * t * 5) > 0.35;
  f.set(mx, by - 37, blink ? P.red : P.warm0);
  if (blink) f.glow(mx + 0.5, by - 36.5, 7, P.red, 0.6);

  // mur cylindrique en briques
  for (let yy = top; yy <= by + 1; yy++)
    for (let xx = 0; xx < bw; xx++) {
      const u = xx / (bw - 1);
      let c = ramp(WALL, u);
      const row = yy - top;
      const course = Math.floor(row / 4);
      if (row % 4 === 3) c = scale(c, 0.68);
      else if ((xx + (course % 2) * 3) % 6 === 0) c = scale(c, 0.8);
      else if (hash(Math.floor((xx + (course % 2) * 3) / 6), course, 9) > 0.78) c = scale(c, 0.9);
      f.set(x0 + xx, yy, c);
    }

  // coupole : éclairage sphérique, la trame fait le modelé
  const rx = 19;
  const ry = 18;
  for (let dy = -ry; dy <= 0; dy++)
    for (let dx = -rx; dx <= rx; dx++) {
      const nx = dx / rx;
      const ny = dy / ry;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      const l = clamp(-nx * 0.6 - ny * 0.55 + nz * 0.45);
      let c = ramp(DOME, l);
      c = mix(c, P.green1, 0.1 * l); // reflet de l'aurore
      if (dy === -6 || dy === -12) c = scale(c, 0.86); // joints des panneaux
      if (r2 > 0.86 && nx > 0.2) c = scale(c, 0.75);
      f.set(bx + dx, top + dy, c);
    }
  // fente ouverte et télescope
  for (let dy = -ry + 1; dy < 0; dy++)
    for (let dx = 4; dx <= 8; dx++) if ((dx / rx) ** 2 + (dy / ry) ** 2 < 0.93) f.set(bx + dx, top + dy, P.ink);
  for (let i = 0; i <= 13; i++) {
    const tx = Math.round(bx + 5 + i * 0.8);
    const ty = Math.round(top - 8 - i * 1.1);
    f.set(tx - 1, ty, P.snow3);
    f.set(tx, ty, P.snow1);
    f.set(tx + 1, ty, P.night5);
    f.set(tx + 1, ty + 1, P.night2);
  }
  f.rect(Math.round(bx + 15), top - 24, 3, 2, P.snow2);
  // corniche
  for (let dx = -rx - 1; dx <= rx + 1; dx++) {
    f.set(bx + dx, top, dx < -9 ? P.snow2 : dx < 2 ? P.night5 : P.night2);
    f.set(bx + dx, top + 1, P.night1);
  }

  // fenêtre éclairée
  const flick = 0.92 + 0.08 * Math.sin(TAU * t * 3);
  const wx = bx - 11;
  const wy = top + 9;
  f.rect(wx - 1, wy - 1, 7, 9, P.warm0);
  for (let yy = 0; yy < 7; yy++)
    for (let xx = 0; xx < 5; xx++) f.set(wx + xx, wy + yy, scale(yy < 3 ? P.warm4 : P.warm3, flick));
  f.rect(wx + 2, wy, 1, 7, P.warm1);
  f.rect(wx, wy + 3, 5, 1, P.warm1);
  f.glow(wx + 2.5, wy + 3.5, 17, P.warm2, 0.4 * flick);
  // porte et lanterne
  f.rect(bx + 3, by - 13, 7, 14, P.ink);
  f.rect(bx + 4, by - 12, 5, 13, P.warm0);
  f.set(bx + 8, by - 6, P.warm3);
  f.set(bx + 6, by - 15, P.warm5);
  f.glow(bx + 6.5, by - 14.5, 7, P.warm3, 0.5);
}

function hill(f: Frame, camX: number, camY: number) {
  for (let x = 0; x < W; x++) {
    const sx = x + camX;
    const r = hillY(sx) + camY;
    for (let y = Math.floor(r); y < H; y++) {
      const d = y - r;
      let c: RGB;
      if (d < 1) c = P.snow3;
      else if (d < 3) c = P.snow2;
      else {
        const n = fbm(sx * 0.09, y * 0.16, 3, 41);
        c = mix(P.snow1, P.night4, clamp(d / 34 + (n - 0.5) * 0.7));
      }
      // lumière chaude de la fenêtre et de la porte sur la neige
      const spill =
        Math.exp(-(((sx - 103) / 8) ** 2) - ((d - 2) / 3.5) ** 2) * 0.9 +
        Math.exp(-(((sx - 118) / 5) ** 2) - ((d - 1.5) / 3) ** 2) * 0.8;
      f.set(x, y, spill > 0.08 ? mix(c, spill > 0.5 ? P.warm3 : P.dusk, clamp(spill * 1.3)) : c);
    }
  }
}

function pine(f: Frame, px: number, baseY: number, height: number, maxW: number, t: number, phase: number) {
  const tier = Math.max(7, Math.round(height / 8));
  for (let row = 0; row < height; row++) {
    const v = row / height;
    const y = baseY - height + row;
    const sway = Math.round((1 - v) * 1.6 * Math.sin(TAU * (t * 2 + phase) + row * 0.04));
    const saw = 0.45 + 0.55 * ((row % tier) / tier);
    const hw = Math.max(0.6, v * maxW * saw);
    for (let dx = -Math.ceil(hw); dx <= Math.ceil(hw); dx++) {
      if (Math.abs(dx) > hw) continue;
      const x = px + dx + sway;
      // neige posée sur le haut des étages, côté lumière
      const snowy = row % tier < 2 && dx < hw * 0.2 && hash(x, y, 77) > 0.35 && row > 6;
      f.set(x, y, snowy ? P.snow1 : dx < -hw * 0.5 ? P.night1 : P.ink);
    }
  }
  f.rect(px - 1, baseY - 2, 3, 6, P.ink);
}

function snowfall(f: Frame, t: number) {
  const layer = (count: number, seed: number, fallCycles: number, big: boolean, col: RGB, a: number) => {
    for (let i = 0; i < count; i++) {
      const x0 = hash(i, 1, seed) * W;
      const y0 = hash(i, 2, seed) * H;
      const ph = hash(i, 3, seed);
      const y = (y0 + t * H * fallCycles) % H;
      const x = (((x0 + t * W + 5 * Math.sin(TAU * (t * 3 + ph))) % W) + W) % W;
      f.blend(x, y, col, a);
      if (big) {
        f.blend(x + 1, y, col, a * 0.8);
        f.blend(x, y + 1, col, a * 0.6);
      }
    }
  };
  layer(70, 301, 1, false, P.snow2, 0.7);
  layer(26, 302, 2, true, P.white, 0.9);
}

function vignette(f: Frame) {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2);
      const dy = (y - H * 0.55) / (H / 2);
      f.mul(x, y, 1 - 0.32 * clamp(dx * dx * 0.7 + dy * dy * 0.6 - 0.25));
    }
}

function title(f: Frame) {
  const outline = P.ink;
  drawTextCentered(f, 'POURQUOI', W / 2, 44, {size: 1, color: P.snow3, outline});
  drawTextCentered(f, 'LES ÉTOILES', W / 2, 62, {size: 2, color: P.white, outline, shadow: P.ink});
  drawTextCentered(f, 'SCINTILLENT ?', W / 2, 84, {size: 2, color: P.warm4, outline, shadow: P.ink});
}

const render = (frame: number, opts: SceneOptions = {}): Frame => {
  const f = new Frame(W, H);
  const fr = ((frame % N) + N) % N;
  const t = fr / N;
  // caméra : dérive lente, les plans proches bougent plus que les lointains (parallaxe)
  const camX = Math.sin(TAU * t) * 5;
  const camY = Math.cos(TAU * t) * 1.5;

  sky(f, t);
  aurora(f, t);
  shootingStar(f, fr);
  mountains(f, t, camX);
  hill(f, camX, camY);
  observatory(f, Math.round(112 - camX), Math.round(hillY(112) + camY) + 1, t);
  pine(f, Math.round(16 - camX * 1.9), 330, 128, 30, t, 0);
  pine(f, Math.round(49 - camX * 1.6), 326, 62, 15, t, 0.3);
  pine(f, Math.round(170 - camX * 2.1), 332, 96, 24, t, 0.6);
  snowfall(f, t);
  vignette(f);
  if (opts.text !== false) title(f);
  return f;
};

export const observatoire: Scene = {
  id: 'observatoire',
  title: 'Observatoire sous l’aurore',
  width: W,
  height: H,
  scale: 6,
  fps: 30,
  durationInFrames: N,
  palette: Object.values(P),
  dither: 1,
  render,
};
