# Observatoire sous l'aurore — id: observatoire

**Idée en une ligne :** un petit observatoire de montagne, la nuit, sous une aurore.
**Émotion visée :** émerveillement — le calme d'un endroit isolé où quelqu'un veille.
**Format :** grille 180x320, x6 → 1080x1920, 30 i/s, boucle de 10 s (300 images).

## Palette « nuit boréale » (28 couleurs)
- Dominante, nuit : `#05060f #0a0d1f #10163a #172052 #1f2d6b #2a3f86 #3856a0`
- Secondaire, aurore : `#0e3a45 #13595a #1c8a6e #3fc380 #8cf0a0 #d6ffc9`
  et violets `#2b1d4f #4a2f7a #7a4fa8`
- Neige : `#5f7aa8 #8fa9cf #c6d8ef #f4f8ff`
- Accent chaud (fenêtre uniquement) : `#3a1c12 #7a3415 #c4601a #f2a22e #ffd97a #fff3c4`
- Pont chaud/froid `#a8785a`, balise `#d43a3a`

## Lumière
- Principale : l'aurore, en haut à gauche, verte et froide. Elle éclaire le flanc gauche
  des montagnes, de la coupole et du mur.
- Secondaire : la fenêtre et la lanterne, orange, portée d'une quinzaine de pixels,
  tache chaude sur la neige.
- En silhouette : la crête de sapins et les trois sapins d'avant-plan.

## Plans
1. Ciel (y 0-250) : dégradé tramé, voie lactée en diagonale, ~500 étoiles. Fixe.
2. Aurore (y 60-160) : deux rideaux en addition, stries verticales. Fixe.
3. Montagnes lointaines (y 150-260) : pic à gauche, neige en altitude. Parallaxe 0,2.
4. Brume (y 205-250), puis crête de sapins (y 215-245). Parallaxe 0,55.
5. Colline enneigée et observatoire (y 205-320). Parallaxe 1.
6. Sapins d'avant-plan, deux à gauche, un à droite. Parallaxe 1,6 à 2,1.
7. Neige qui tombe, deux profondeurs.

## Composition
- Point focal : la fenêtre orange, sur le tiers droit et le tiers bas, seule tache
  chaude de l'image.
- Le pic de gauche équilibre l'observatoire à droite ; la pente de la colline et le
  télescope mènent l'œil vers l'aurore.
- Le grand sapin de gauche ferme le cadre.
- Titre entre 13 % et 32 % de la hauteur ; rien d'utile dans les 22 % du bas.

## Mouvement
- Aurore : ondulation lente, 1 cycle ; stries, 6 cycles.
- Brume : deux nappes en sens opposés, 1 traversée chacune.
- Étoiles : scintillement, 1 à 4 cycles selon l'étoile.
- Sapins : balancement de la cime, 1,6 px, 2 cycles.
- Fenêtre : léger vacillement, 3 cycles. Balise rouge : 5 éclats.
- Neige : 70 flocons lointains (1 chute), 26 proches (2 chutes).
- Événement : une étoile filante vers la 6e seconde.

## Caméra
Dérive en ellipse de ±5 px en horizontal et ±1,5 px en vertical, 1 cycle.

## Texte
« POURQUOI » (taille 1), « LES ÉTOILES » (taille 2, blanc), « SCINTILLENT ? »
(taille 2, jaune). Contour et ombre noirs.

## Critères de refus
- La coupole paraît plate ou se confond avec la montagne.
- Les montagnes montrent des bandes verticales ou un aplat sans relief.
- La lumière chaude bave en trame violette sur la neige.
- Le titre touche l'aurore au point de devenir illisible.
- Un saut est visible au raccord de la boucle.
