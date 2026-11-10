// Bruit déterministe : même image pour la même frame, sur n'importe quelle machine.
// Jamais de Math.random() dans une scène.

import {smooth} from './frame';

export const hash = (x: number, y = 0, seed = 0): number => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const wrap = (i: number, p: number) => (p > 0 ? ((i % p) + p) % p : i);

/**
 * Bruit de valeur 2D, 0..1. px / py : période entière optionnelle sur chaque axe.
 * Une période sert à boucler : faire avancer la coordonnée d'exactement `période`
 * sur la durée de la boucle donne un mouvement sans raccord visible.
 */
export const noise2 = (x: number, y: number, seed = 0, px = 0, py = 0): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const x0 = wrap(ix, px);
  const x1 = wrap(ix + 1, px);
  const y0 = wrap(iy, py);
  const y1 = wrap(iy + 1, py);
  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

/** Bruit fractal (plusieurs octaves), 0..1. Les périodes doublent avec la fréquence. */
export const fbm = (x: number, y: number, octaves = 4, seed = 0, px = 0, py = 0): number => {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(x * f, y * f, seed + o * 17, px * f, py * f);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
};
