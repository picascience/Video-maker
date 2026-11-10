# Video-maker — vidéos dessinées par code, dirigées

Ce dépôt produit des vidéos verticales (Reels, TikTok, Shorts) en pixel art, dessinées
entièrement par du code TypeScript. La qualité ne vient pas du modèle mais de la
**direction** : un brief précis, un moteur qui impose le style, et une boucle de revue
où l'on regarde vraiment les images.

## Règle n° 1 : ne jamais coder une scène à partir d'une seule phrase

Toute demande de vidéo passe par quatre étapes, dans l'ordre :

1. **Brief** — skill `direction` : transformer l'idée en `briefs/<id>.md`. Le montrer à
   l'utilisateur et attendre son accord avant de coder.
2. **Scène** — skill `pixel-art` : écrire `src/scenes/<id>.ts` avec le moteur
   `src/engine`, plan par plan, et l'enregistrer dans `src/scenes/index.ts`.
3. **Revue** — skill `revue` : `npm run qa`, `npm run still`, ouvrir les PNG, critiquer,
   corriger. Au moins deux passes. Ne jamais annoncer « terminé » sans avoir regardé.
4. **Montage** — skill `reel` si la vidéo a une voix, des sous-titres ou plusieurs plans.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run still -- <id> [frames] [--no-text] [--sheet]` | Images fixes en moins d'une seconde → `out/stills/` |
| `npm run qa -- <id>` | Boucle, images figées, palette, zones sûres |
| `npm run video -- <id> [--loops n] [--audio f.mp3]` | MP4 1080x1920 via ffmpeg, sans navigateur |
| `npm run studio` | Remotion Studio (aperçu, montage avec audio) |
| `npm run render -- <id> out/<id>.mp4` | Rendu Remotion |
| `npm run check` | Vérification TypeScript |

## Interdits

- `Math.random()`, `Date.now()` dans une scène : utiliser `hash`, `noise2`, `fbm`.
- Couleur hors palette, dégradé CSS, flou, ombre CSS, texte HTML par-dessus l'image.
- Agrandissement lissé : toujours au plus proche voisin (`image-rendering: pixelated`).
- Mouvement qui ne boucle pas : chaque cycle fait un nombre entier de tours sur la durée.
- Personnages, logos ou œuvres existants : tout est original.
