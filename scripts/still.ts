// Rend des images fixes en une fraction de seconde, sans navigateur.
// C'est l'outil de la boucle « rendre -> regarder -> corriger ».
//
//   npm run still -- observatoire                 (frames 0, 1/3, 2/3)
//   npm run still -- observatoire 0,120,180 --scale 3 --no-text
//   npm run still -- observatoire --sheet         (planche de 6 frames côte à côte)

import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {renderPixels} from '../src/engine';
import {getScene} from '../src/scenes';
import {encodePng, upscale} from './png';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--scale'));

const scene = getScene(positional[0] ?? 'observatoire');
const k = Number(opt('scale', '3'));
const text = !flag('no-text');
const outDir = 'out/stills';
mkdirSync(outDir, {recursive: true});
const {width: w, height: h, durationInFrames: n} = scene;

if (flag('sheet')) {
  const count = 6;
  const sheet = new Uint8ClampedArray(w * count * h * 4);
  for (let i = 0; i < count; i++) {
    const px = renderPixels(scene, Math.floor((i * n) / count), {text});
    for (let y = 0; y < h; y++) sheet.set(px.subarray(y * w * 4, (y + 1) * w * 4), (y * w * count + i * w) * 4);
  }
  const file = join(outDir, `${scene.id}-planche.png`);
  writeFileSync(file, encodePng(upscale(sheet, w * count, h, 2), w * count * 2, h * 2));
  console.log(file);
} else {
  const frames = positional[1]
    ? positional[1].split(',').map(Number)
    : [0, Math.floor(n / 3), Math.floor((2 * n) / 3)];
  for (const fr of frames) {
    const px = renderPixels(scene, fr, {text});
    const file = join(outDir, `${scene.id}-${String(fr).padStart(4, '0')}.png`);
    writeFileSync(file, encodePng(upscale(px, w, h, k), w * k, h * k));
    console.log(file);
  }
}
