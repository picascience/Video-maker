import type {Scene} from '../engine';
import {observatoire} from './observatoire';

// Ajouter chaque nouvelle scène ici : elle devient disponible pour
// `npm run still`, `npm run video` et Remotion Studio.
export const scenes: Scene[] = [observatoire];

export const getScene = (id: string): Scene => {
  const s = scenes.find((sc) => sc.id === id);
  if (!s) throw new Error(`Scène inconnue : ${id}. Disponibles : ${scenes.map((sc) => sc.id).join(', ')}`);
  return s;
};
