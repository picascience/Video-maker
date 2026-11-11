// Calque avec masque : on y dessine un sujet (un robot, un personnage) à part,
// puis on le recopie dans l'image en le découpant, le déplaçant ou le désintégrant.

import type {RGB} from './frame';

export class Layer {
  readonly data: Float32Array;
  readonly mask: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.data = new Float32Array(w * h * 3);
    this.mask = new Uint8Array(w * h);
  }

  clear() {
    this.mask.fill(0);
  }

  set(x: number, y: number, c: RGB) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const p = y * this.w + x;
    this.mask[p] = 1;
    this.data[p * 3] = c[0];
    this.data[p * 3 + 1] = c[1];
    this.data[p * 3 + 2] = c[2];
  }

  has(x: number, y: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.mask[y * this.w + x] === 1;
  }

  each(cb: (x: number, y: number, r: number, g: number, b: number) => void) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const p = y * this.w + x;
        if (this.mask[p]) cb(x, y, this.data[p * 3], this.data[p * 3 + 1], this.data[p * 3 + 2]);
      }
  }
}
