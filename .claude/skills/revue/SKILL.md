---
name: revue
description: Boucle de revue visuelle d'une scène — rendre des images fixes, les ouvrir, les critiquer avec une grille précise, corriger et recommencer. À utiliser après toute écriture ou modification d'une scène, avant de dire qu'elle est terminée.
---

# Revue : rendre, regarder, corriger

Un rendu médiocre vient presque toujours du fait que personne n'a regardé l'image.
Le code compile, donc on livre. Ici, on ne livre rien sans l'avoir vu.

## Boucle (deux passes au minimum)

1. `npm run qa -- <id>` — corriger tout échec avant d'aller plus loin.
2. `npm run still -- <id> 0,<N/3>,<2N/3> --scale 3` puis **ouvrir les PNG** de
   `out/stills/` avec l'outil de lecture d'images.
3. `npm run still -- <id> --sheet` pour juger le mouvement sur 6 instants.
4. Noter chaque point de la grille de 0 à 2. Tout 0 se corrige ; viser 16/20.
5. Corriger dans la scène, relancer à partir de 1.
6. À la fin : `npm run video -- <id>` et donner le chemin du MP4.

## Grille de critique (0 = raté, 1 = passable, 2 = bon)

1. **Lisibilité à 1 seconde.** Sujet identifiable en vignette, sans lire le texte.
2. **Point focal.** Le plus fort contraste de valeur est bien sur le sujet.
3. **Profondeur.** On distingue au moins 4 plans ; le lointain est plus clair et plus doux.
4. **Volume.** Les formes ont un côté lumière et un côté ombre cohérents avec la source.
5. **Matière.** Aucune grande surface en aplat vide, aucune zone de pixels parasites.
6. **Palette.** Harmonie froide/chaude tenue, accent utilisé à un seul endroit.
7. **Silhouettes.** Avant-plan net, formes reconnaissables, pas de blocs rectangulaires.
8. **Texte.** Lisible sur téléphone, contour présent, dans les zones sûres.
9. **Mouvement.** Trois échelles visibles sur la planche (lent, moyen, rapide).
10. **Boucle.** La première et la dernière colonne de la planche s'enchaînent.

## Défauts fréquents et corrections

| Symptôme | Cause probable | Correction |
| --- | --- | --- |
| Lignes ou pixels noirs isolés | `NaN` (puissance d'un négatif, division par 0) | borner avec `clamp` / `Math.max(0, …)` |
| Bandes verticales sur un relief | éclairage calculé colonne par colonne en tout ou rien | pente lissée sur ±3 px puis `smooth` |
| Trame sale entre deux couleurs sans rapport | pas de teinte intermédiaire dans la palette | ajouter une couleur pont ou resserrer la zone |
| Image plate | mêmes valeurs à tous les plans | éclaircir le fond, assombrir l'avant-plan, ajouter de la brume |
| Sujet perdu | trop petit ou concurrencé | l'agrandir, le placer sur un tiers, baisser le contraste autour |
| Fourmillement en vidéo | bruit qui change à chaque image | faire varier le bruit lentement, jamais par `hash(frame)` |
| Saut au raccord | cycle non entier | revoir chaque `sin`/bruit avec la section « Boucler » du skill `pixel-art` |

## Compte rendu

Terminer par trois lignes : la note, ce qui a été corrigé pendant la revue, et ce qui
reste perfectible. Ne pas masquer un défaut connu.
