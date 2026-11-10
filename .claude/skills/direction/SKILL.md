---
name: direction
description: Transformer une idée de vidéo d'une ligne en brief de direction artistique complet (palette, plans, lumière, mouvement, caméra, texte) avant d'écrire le moindre code. À utiliser pour toute nouvelle scène ou vidéo.
---

# Direction artistique : de la phrase au brief

Une phrase (« un phare dans la tempête ») laisse cent décisions au hasard, et le hasard
donne toujours la même image : dégradé lisse, formes géométriques, sujet centré, rien
qui bouge vraiment. Diriger, c'est prendre ces décisions **avant** de coder et les écrire.

## Méthode

1. Lire l'idée. Poser au plus deux questions si le sujet ou le ton est ambigu.
2. Écrire `briefs/<id>.md` en suivant le gabarit ci-dessous. Chaque rubrique doit
   contenir des valeurs concrètes (codes hex, pixels, secondes), jamais d'adjectifs seuls.
3. Montrer le brief et attendre l'accord. Ensuite seulement, passer au skill `pixel-art`.

## Gabarit du brief

```md
# <Titre> — id: <id>

**Idée en une ligne :** ...
**Émotion visée :** un seul mot + ce que le spectateur doit ressentir à la 1re seconde.
**Format :** grille 180x320, agrandie x6 → 1080x1920, 30 i/s, boucle de N secondes.

## Palette (24 à 32 couleurs, en rampes)
- Rampe dominante (60 % de l'image) : 6-7 teintes du plus sombre au plus clair, hex.
- Rampe secondaire (30 %) : 4-6 teintes.
- Accent (10 %, la couleur complémentaire, réservée au point focal) : 4-6 teintes.
- Blanc cassé et noir teinté (jamais #000000 ni #ffffff purs).

## Lumière
- Source principale : position, couleur, ce qu'elle éclaire.
- Source secondaire (accent chaud ou froid opposé) : où, quelle portée.
- Ce qui reste en silhouette.

## Plans, du fond vers l'avant (4 à 6)
Pour chaque plan : contenu, zone verticale en pixels, rampe utilisée, texture
(trame, briques, bruit), facteur de parallaxe (0 = fixe, 2 = très proche).

## Composition
- Point focal : position sur les tiers, taille en pixels.
- Lignes qui mènent l'œil vers lui.
- Masse sombre d'avant-plan qui encadre.
- Zones sûres : rien d'important dans les 11 % du haut, les 22 % du bas, ni la colonne
  droite sous la mi-hauteur (boutons de l'application).

## Mouvement (tout boucle)
Liste de 5 à 8 mouvements, chacun avec : quoi, amplitude en pixels, nombre de cycles
sur la boucle. Trois échelles obligatoires : lent et large (ciel, brume), moyen
(sujet), rapide et petit (particules, clignotements).
- Un événement ponctuel (éclair, étoile filante) pour récompenser le 2e visionnage.

## Caméra
Dérive ou zoom, amplitude, et quels plans bougent le plus.

## Texte
Accroche de 2 à 4 mots par ligne, mot-clé dans la couleur d'accent, position, taille.

## Critères de refus
3 à 5 défauts précis qui obligent à recommencer (ex. « la coupole paraît plate »).
```

## Principes à appliquer en écrivant le brief

- **Une seule idée lumineuse.** Une lumière chaude dans un monde froid, ou l'inverse.
- **Contraste de valeur avant couleur.** Le point focal porte l'écart clair/sombre le
  plus fort de l'image ; plisser les yeux doit suffire à le trouver.
- **Perspective atmosphérique.** Plus c'est loin, plus c'est clair, bleuté, peu contrasté.
- **Silhouettes lisibles.** Chaque objet doit se reconnaître rempli en noir.
- **Texture partout, bruit nulle part.** Chaque surface a un motif voulu (briques,
  strates, trame) ; aucun pixel isolé sans raison.
- **Asymétrie.** Sujet sur un tiers, masse opposée de l'autre côté pour équilibrer.

Voir `briefs/observatoire.md` pour un brief complet et la scène qui en découle.
