---
name: pixel-art
description: Écrire une scène pixel art animée avec le moteur src/engine (tampon basse résolution, palette, tramage Bayer, bruit bouclé, parallaxe, police bitmap). À utiliser pour coder ou modifier un fichier de src/scenes à partir d'un brief validé.
---

# Écrire une scène avec le moteur

Prérequis : un brief validé dans `briefs/<id>.md` (skill `direction`).
Modèle à lire avant de commencer : `src/scenes/observatoire.ts`.

## Pourquoi ce moteur donne un rendu « dessiné »

1. **Vraie grille de pixels.** On dessine dans un tampon de 180x320, agrandi x6 au plus
   proche voisin. Pas de SVG, pas de formes vectorielles réduites après coup.
2. **Palette fermée.** Toute l'image est ramenée aux couleurs de la scène par `quantize`.
3. **Tramage ordonné.** Les dégradés deviennent des trames de Bayer 4x4 entre deux
   couleurs voisines de la palette : c'est ce qui donne le grain du pixel art, et la
   trame reste stable d'une image à l'autre (pas de fourmillement).
4. **Déterminisme.** `render(frame)` est une fonction pure : même image partout.

## Structure d'une scène

```ts
import {Frame, Scene, hex, ramp, mix, fbm, noise2, hash, drawTextCentered} from '../engine';

const W = 180, H = 320, N = 300;            // grille et durée de boucle (frames)
const P = { ink: hex('#05060f'), /* ... toutes les couleurs du brief */ };

const render = (frame: number, opts = {}) => {
  const f = new Frame(W, H);
  const t = (((frame % N) + N) % N) / N;    // 0..1, temps de boucle
  // 1. fond  2. plans lointains  3. brume  4. sujet  5. avant-plan
  // 6. particules  7. vignette  8. texte (si opts.text !== false)
  return f;
};

export const maScene: Scene = {id: 'ma-scene', title: '...', width: W, height: H,
  scale: 6, fps: 30, durationInFrames: N, palette: Object.values(P), render};
```

Puis l'ajouter au tableau de `src/scenes/index.ts`.

## Boîte à outils

| Besoin | Outil |
| --- | --- |
| Aplat net | `f.set`, `f.rect`, `f.line` avec une couleur exacte de `P` |
| Dégradé tramé | `ramp([[0, P.a], [1, P.b]], v)` puis `f.set` (la trame vient à la quantification) |
| Brume, voile | `f.blend(x, y, couleur, alpha)` avec `fbm` |
| Lumière, halo, aurore | `f.add(...)`, `f.glow(cx, cy, rayon, couleur, force)` |
| Ombre, vignette | `f.mul(x, y, facteur)` |
| Relief naturel | `fbm(x * 0.02, graine)` pour une crête, `noise2` pour la matière |
| Dispersion fixe | `hash(i, j, graine)` (positions d'étoiles, de flocons, de briques) |
| Texte | `drawTextCentered(f, 'TEXTE', cx, y, {size: 2, color, outline, shadow})` |

## Techniques qui font la différence

- **Volume par la lumière.** Pour une sphère ou un cylindre, calculer une normale,
  un éclairage `l` entre 0 et 1, puis `ramp(RAMPE, l)`. La trame modèle la forme.
- **Matière.** Briques : assombrir une ligne sur 4 et un joint décalé une rangée sur
  deux. Roche : stries de `noise2` en diagonale. Neige : liseré clair de 1 à 2 px sur
  l'arête, puis dégradé vers l'ombre.
- **Liseré de crête.** 1 px plus clair côté lumière sur chaque silhouette importante.
- **Profondeur.** Position écran = position monde − `cam * profondeur`. Profondeur 0,2
  pour les montagnes lointaines, 1 pour le sujet, 1,6 à 2 pour l'avant-plan.
- **Lumière qui déborde.** Une fenêtre éclairée = aplat chaud + `glow` + tache chaude
  sur le sol. Prévoir dans la palette une teinte intermédiaire chaud/froid.
- **Aurores, faisceaux, pluie.** Toujours en `add`, modulés par un bruit en colonnes.

## Boucler sans raccord

- Sinus : `Math.sin(TAU * t * k)` avec `k` **entier**.
- Bruit animé : coordonnée `t * p` avec la période `p` passée à `noise2`/`fbm`
  (`noise2(x, t * 4, graine, 0, 4)`).
- Dérive (brume, nuages) : décalage de `t * p` sur un axe de période `p`.
- Particules : `(y0 + t * H * k) % H`, `k` entier.
- Événement unique : fenêtre de frames au milieu de la boucle, jamais près du raccord.

## Avant de passer à la revue

`npm run check` puis `npm run qa -- <id>` doivent passer.
