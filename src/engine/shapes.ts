import {Frame, type RGB} from './frame';

export type Put = (x: number, y: number, c: RGB) => void;

/**
 * Dessine une forme orientée (épée, bras, tige) par transformation inverse :
 * pour chaque pixel de l'écran on calcule sa position (u, v) dans le repère de la forme,
 * puis `shade(u, v)` renvoie la couleur, ou null hors de la silhouette.
 * u : le long de l'axe (direction `ang`), v : en travers (axe tourné de +90°).
 * La texture reste nette : on l'échantillonne à la case entière dans son propre repère.
 */
export const orient = (
  put: Put,
  ox: number,
  oy: number,
  ang: number,
  u0: number,
  u1: number,
  vh: number,
  shade: (u: number, v: number) => RGB | null,
) => {
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [u, v] of [[u0, -vh], [u0, vh], [u1, -vh], [u1, vh]]) {
    const x = ox + u * ca - v * sa;
    const y = oy + u * sa + v * ca;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(319, Math.ceil(maxY)); y++)
    for (let x = Math.max(0, Math.floor(minX)); x <= Math.min(179, Math.ceil(maxX)); x++) {
      const dx = x + 0.5 - ox;
      const dy = y + 0.5 - oy;
      const u = dx * ca + dy * sa;
      const v = -dx * sa + dy * ca;
      if (u < u0 || u >= u1 || v < -vh || v > vh) continue;
      const c = shade(u, v);
      if (c) put(x, y, c);
    }
};

/** Décale toute l'image (tremblement de caméra). Les bords se répètent. */
export const shifted = (f: Frame, dx: number, dy: number): Frame => {
  const out = new Frame(f.w, f.h);
  for (let y = 0; y < f.h; y++) {
    const sy = Math.min(f.h - 1, Math.max(0, y - dy));
    for (let x = 0; x < f.w; x++) {
      const sx = Math.min(f.w - 1, Math.max(0, x - dx));
      const s = (sy * f.w + sx) * 3;
      const d = (y * f.w + x) * 3;
      out.data[d] = f.data[s];
      out.data[d + 1] = f.data[s + 1];
      out.data[d + 2] = f.data[s + 2];
    }
  }
  return out;
};
