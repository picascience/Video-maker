// Contrôle qualité automatique d'une scène, avant de la regarder à l'œil.
//   npm run qa -- observatoire
// Vérifie : boucle sans saut, pas d'image figée, mouvement présent,
// palette respectée, texte hors des zones couvertes par l'interface.

import {SAFE, renderPixels} from '../src/engine';
import {getScene} from '../src/scenes';

const scene = getScene(process.argv[2] ?? 'observatoire');
const {width: w, height: h, durationInFrames: n} = scene;

const diff = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
  let d = 0;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) d++;
  return (d / (w * h)) * 100;
};

const frames: Uint8ClampedArray[] = [];
for (let i = 0; i < n; i++) frames.push(renderPixels(scene, i));

const steps: number[] = [];
for (let i = 1; i < n; i++) steps.push(diff(frames[i - 1], frames[i]));
const sorted = [...steps].sort((a, b) => a - b);
const median = sorted[sorted.length >> 1];
const max = sorted[sorted.length - 1];
const seam = diff(frames[n - 1], frames[0]);
const frozen = steps.filter((s) => s === 0).length;

const colours = new Set<number>();
for (const fr of [frames[0], frames[n >> 1]])
  for (let i = 0; i < fr.length; i += 4) colours.add((fr[i] << 16) | (fr[i + 1] << 8) | fr[i + 2]);

// le texte ne change pas la zone si l'image avec et sans texte y est identique
const withText = frames[0];
const noText = renderPixels(scene, 0, {text: false});
let textInUnsafe = 0;
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const unsafe = y < h * SAFE.top || y > h * (1 - SAFE.bottom) || (x > w * (1 - SAFE.right) && y > h * 0.55);
    const i = (y * w + x) * 4;
    if (unsafe && (withText[i] !== noText[i] || withText[i + 1] !== noText[i + 1])) textInUnsafe++;
  }

const results: [string, boolean, string][] = [
  ['Boucle sans saut', seam <= Math.max(max * 1.15, median * 2), `raccord ${seam.toFixed(1)} % de pixels changés (médiane ${median.toFixed(1)} %, max ${max.toFixed(1)} %)`],
  ['Aucune image figée', frozen === 0, `${frozen} image(s) identique(s) à la précédente`],
  ['Mouvement présent', median > 0.3, `${median.toFixed(1)} % de pixels changent par image`],
  ['Palette respectée', colours.size <= scene.palette.length, `${colours.size} couleurs utilisées sur ${scene.palette.length}`],
  ['Texte en zone sûre', textInUnsafe === 0, `${textInUnsafe} pixel(s) de texte sous l'interface`],
];
let ok = true;
for (const [name, pass, detail] of results) {
  ok &&= pass;
  console.log(`${pass ? 'OK   ' : 'ÉCHEC'} ${name} — ${detail}`);
}
process.exit(ok ? 0 : 1);
