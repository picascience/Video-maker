// Tampon d'image basse résolution en couleurs flottantes (0..255).
// Tout est dessiné ici, puis quantifié sur la palette (voir palette.ts).

export type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
export const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

/** Dégradé à paliers : stops = [[position, couleur], ...] triés par position. */
export const ramp = (stops: [number, RGB][], v: number): RGB => {
  if (v <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      return mix(c0, c1, (v - p0) / (p1 - p0));
    }
  }
  return stops[stops.length - 1][1];
};

export class Frame {
  readonly data: Float32Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Float32Array(w * h * 3);
  }

  private idx(x: number, y: number) {
    return (y * this.w + x) * 3;
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): RGB {
    const i = this.idx(x, y);
    return [this.data[i], this.data[i + 1], this.data[i + 2]];
  }

  /** Écrit une couleur opaque. */
  set(x: number, y: number, c: RGB) {
    x |= 0;
    y |= 0;
    if (!this.inside(x, y)) return;
    const i = this.idx(x, y);
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }

  /** Mélange alpha (brume, ombres douces). */
  blend(x: number, y: number, c: RGB, a: number) {
    x |= 0;
    y |= 0;
    if (a <= 0 || !this.inside(x, y)) return;
    const i = this.idx(x, y);
    const k = a > 1 ? 1 : a;
    this.data[i] += (c[0] - this.data[i]) * k;
    this.data[i + 1] += (c[1] - this.data[i + 1]) * k;
    this.data[i + 2] += (c[2] - this.data[i + 2]) * k;
  }

  /** Addition lumineuse (halos, aurores, faisceaux). */
  add(x: number, y: number, c: RGB, a: number) {
    x |= 0;
    y |= 0;
    if (a <= 0 || !this.inside(x, y)) return;
    const i = this.idx(x, y);
    this.data[i] = Math.min(255, this.data[i] + c[0] * a);
    this.data[i + 1] = Math.min(255, this.data[i + 1] + c[1] * a);
    this.data[i + 2] = Math.min(255, this.data[i + 2] + c[2] * a);
  }

  /** Multiplie la luminosité (vignette, ombre portée). */
  mul(x: number, y: number, k: number) {
    if (!this.inside(x, y)) return;
    const i = this.idx(x, y);
    this.data[i] *= k;
    this.data[i + 1] *= k;
    this.data[i + 2] *= k;
  }

  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, c);
  }

  /** Ligne de Bresenham, épaisseur 1. */
  line(x0: number, y0: number, x1: number, y1: number, c: RGB) {
    x0 |= 0;
    y0 |= 0;
    x1 |= 0;
    y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** Halo radial additif. */
  glow(cx: number, cy: number, r: number, c: RGB, strength: number) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d < 1) this.add(x, y, c, strength * (1 - d) * (1 - d));
      }
  }
}
