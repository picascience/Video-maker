import type {Frame, RGB} from './frame';
import {quantize} from './palette';

export interface SceneOptions {
  /** false = image seule, sans titre (utile pour juger le dessin). */
  text?: boolean;
}

export interface Scene {
  id: string;
  title: string;
  /** Taille de la grille de pixels (pas de la vidéo). */
  width: number;
  height: number;
  /** Facteur d'agrandissement : width * scale = largeur vidéo. */
  scale: number;
  fps: number;
  durationInFrames: number;
  palette: RGB[];
  dither?: number;
  /** Fonction pure : même frame -> même image. La dernière frame doit s'enchaîner sur la première. */
  render: (frame: number, opts?: SceneOptions) => Frame;
}

/** Rend une frame en RGBA à la résolution de la grille (à agrandir au plus proche voisin). */
export const renderPixels = (scene: Scene, frame: number, opts?: SceneOptions): Uint8ClampedArray =>
  quantize(scene.render(frame, opts), scene.palette, {dither: scene.dither ?? 1});
