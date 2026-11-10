// Rendu vidéo rapide : frames calculées en Node, encodées par ffmpeg.
// Pas de navigateur -> quelques secondes pour 10 s de vidéo en 1080x1920.
//
//   npm run video -- observatoire                (une boucle)
//   npm run video -- observatoire --loops 3      (boucle répétée 3 fois)
//   npm run video -- observatoire --audio voix.mp3
//
// Nécessite ffmpeg dans le PATH (Windows : `winget install ffmpeg`).

import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {renderPixels} from '../src/engine';
import {getScene} from '../src/scenes';

const args = process.argv.slice(2);
const opt = (name: string, def?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const scene = getScene(args[0] && !args[0].startsWith('--') ? args[0] : 'observatoire');
const loops = Number(opt('loops', '1'));
const audio = opt('audio');
const text = !args.includes('--no-text');
mkdirSync('out', {recursive: true});
const out = opt('out', `out/${scene.id}.mp4`)!;
const {width: w, height: h, scale: k, fps, durationInFrames: n} = scene;

const ff = spawn(
  'ffmpeg',
  [
    '-y', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`, '-r', String(fps), '-i', 'pipe:0',
    ...(audio ? ['-i', audio] : []),
    '-vf', `scale=${w * k}:${h * k}:flags=neighbor`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
    ...(audio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []),
    '-movflags', '+faststart', out,
  ],
  {stdio: ['pipe', 'inherit', 'inherit']},
);

const main = async () => {
  const t0 = Date.now();
  for (let i = 0; i < n * loops; i++) {
    const px = renderPixels(scene, i % n, {text});
    if (!ff.stdin.write(Buffer.from(px.buffer))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`${out} — ${w * k}x${h * k}, ${((n * loops) / fps).toFixed(1)} s, rendu en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
};
main();
