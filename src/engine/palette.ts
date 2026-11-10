// Quantification sur palette limitée avec tramage ordonné (Bayer 4x4).
// C'est l'étape qui transforme un dégradé « vectoriel lisse » en pixel art :
// chaque pixel prend l'une des deux couleurs de palette les plus proches,
// choisie selon une matrice fixe -> trame régulière, stable d'une frame à l'autre.

import type {Frame, RGB} from './frame';

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

export interface QuantizeOptions {
  /** 0 = aplats nets, 1 = tramage complet. */
  dither?: number;
}

/** Renvoie un tampon RGBA 8 bits prêt pour un canvas ou un PNG. */
export const quantize = (frame: Frame, palette: RGB[], opts: QuantizeOptions = {}): Uint8ClampedArray => {
  const strength = opts.dither ?? 1;
  const {w, h, data} = frame;
  const out = new Uint8ClampedArray(w * h * 4);
  const n = palette.length;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let i1 = 0;
      let i2 = 0;
      let d1 = Infinity;
      let d2 = Infinity;
      for (let p = 0; p < n; p++) {
        const c = palette[p];
        const dr = r - c[0];
        const dg = g - c[1];
        const db = b - c[2];
        // distance pondérée : l'œil est plus sensible au vert qu'au bleu
        const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
        if (d < d1) {
          d2 = d1;
          i2 = i1;
          d1 = d;
          i1 = p;
        } else if (d < d2) {
          d2 = d;
          i2 = p;
        }
      }
      const c1 = palette[i1];
      const c2 = palette[i2];
      // position du pixel entre c1 et c2 (0 = c1, 0.5 = à mi-chemin)
      const vx = c2[0] - c1[0];
      const vy = c2[1] - c1[1];
      const vz = c2[2] - c1[2];
      const len = vx * vx + vy * vy + vz * vz;
      let t = len > 0 ? ((r - c1[0]) * vx + (g - c1[1]) * vy + (b - c1[2]) * vz) / len : 0;
      t *= strength;
      const pick = t > BAYER4[(y & 3) * 4 + (x & 3)] ? c2 : c1;
      const o = (y * w + x) * 4;
      out[o] = pick[0];
      out[o + 1] = pick[1];
      out[o + 2] = pick[2];
      out[o + 3] = 255;
    }
  }
  return out;
};
