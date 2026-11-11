# L'épée carte mère — id: epee-carte-mere

**Idée en une ligne :** une épée dont la lame est une carte mère tranche net un robot de combat, qui se sépare en deux le long d'une ligne de coupe incandescente.
**Émotion visée :** puissance — la satisfaction d'un coup parfait, net et sans effort, dès la première seconde.
**Format :** grille 180x320, x6 → 1080x1920, 30 i/s, boucle de 10 s (300 images).

## Palette « atelier de circuits » (30 couleurs)
- Dominante, salle sombre : `#04080c #08121a #0c1f2a #123240 #1b4a58 #2a6a74`
- Secondaire, la lame (PCB vert + cuivre) : `#0a2a1f #0f4a35 #17704a #24a066` et traces `#5a3a14 #a6701f #e0a838 #ffe08a`
- Énergie du tranchant, cyan : `#0a4a6a #1a8fc0 #5ad8ff #c8f6ff`
- Robot, acier : `#1a1f2a #2c3442 #46526a #6f7f9a #a4b4cc`
- Accent (coupe, étincelles, œil du robot, 10 % de l'image) : `#a3200f #ff5a1f #ffb347 #fff1c8`
- Noir teinté `#04080c`, blanc cassé `#fff1c8`.

## Lumière
- Principale : le tranchant cyan de l'épée, froid. Il éclaire le robot côté épée, le sol et les alentours.
- Secondaire : la ligne de coupe orange, apparaît au coup et chauffe l'acier autour (accent chaud unique, c'est le pic de contraste).
- En silhouette : les baies de serveurs du fond, les bras de maintenance, le bord inférieur du cadre.

## L'épée (le sujet)
- Lame de 150 px, large de 18 px, pointe en biseau. Corps = PCB vert `#0f4a35` à `#24a066`, modelé par une lumière venue du haut gauche.
- Pistes en cuivre `#a6701f` / `#e0a838` qui serpentent en lignes à 45° et 90°, avec pastilles rondes aux angles.
- Sur la lame : un processeur carré en relief au tiers bas (socket doré), deux fentes RAM en gouttière centrale, trois condensateurs cylindriques en crans, connecteur PCIe doré en dents de scie sur le dos.
- Tranchant : fil cyan `#5ad8ff` d'1 px, halo `#1a8fc0` de 3 px, scintillement le long du fil.
- Garde : radiateur à ailettes (7 ailettes) surmonté d'un ventilateur qui tourne.
- Poignée : câble noir gainé avec anneaux dorés, pommeau = puce ronde avec voyant cyan.
- Silhouette remplie en noir : une épée reconnaissable (lame, garde, poignée) sans les détails.

## Le robot (original, jamais un personnage existant)
- Bipède trapu de 100 px de haut : torse carré en plaques d'acier `#46526a`, tête plate à visière horizontale, œil unique orange `#ff5a1f`, épaules en pistons, avant-bras en lames, hydrauliques visibles aux genoux.
- Éclairage cyan à gauche, ombre acier `#1a1f2a` à droite, liseré de crête `#a4b4cc` d'1 px.

## Plans, du fond vers l'avant
1. Salle (y 0-200) : dégradé tramé `#04080c`→`#123240`, motif hexagonal discret, poutres. Parallaxe 0.
2. Baies de serveurs (y 90-250) : rangées d'armoires sombres avec voyants (verts, cyan, un orange rare). Rampe dominante. Parallaxe 0.2.
3. Passerelle et tuyaux (y 190-250) : silhouettes bleu-noir, brume cyan au pied. Parallaxe 0.5.
4. Sol (y 245-320) : plaques métalliques, reflet vertical tramé de l'épée et de la coupe. Parallaxe 1.
5. Robot (centre, y 110-250) : acier, parallaxe 1.
6. Épée (avant-plan, diagonale de 25°, y 40-260) : parallaxe 1.4.
7. Avant-plan : câbles pendants noirs à gauche et en haut, étincelles, poussière. Parallaxe 1.9.

## Composition
- Point focal : la ligne de coupe sur le robot, au tiers gauche et au tiers bas (x≈80, y≈175). Elle porte le plus fort contraste : orange vif sur acier sombre.
- Lignes qui mènent l'œil : l'épée en diagonale pointe vers le torse du robot, les poutres du plafond convergent.
- Masse sombre d'avant-plan : câbles à gauche et baie de serveurs à droite, ils encadrent.
- Zones sûres : titre entre 13 % et 30 %, robot et coupe entre 35 % et 78 %, rien d'important sous 78 % ni sur la colonne de droite sous la mi-hauteur.

## Déroulé (boucle de 10 s)
| Temps | Images | Action |
| --- | --- | --- |
| 0 à 1,5 s | 0-45 | L'épée flotte, la lumière pulse, titre visible. Le robot est en veille, œil sombre. |
| 1,5 à 3 s | 45-90 | Le robot s'allume (œil orange), avance de 10 px, lève un bras-lame. |
| 3 à 3,3 s | 90-99 | Armement : l'épée recule de 12 px, le halo se concentre. |
| 3,3 à 3,5 s | 99-105 | **Coup** : balayage diagonal en 6 images, traînée cyan en fondu tramé. |
| 3,5 à 3,6 s | 105-108 | Arrêt sur image de 3 images (hit stop), flash blanc `#fff1c8` de 2 images, onde de choc. |
| 3,6 à 6,5 s | 108-195 | La ligne de coupe s'ouvre en orange. Les deux moitiés glissent de 14 px en 40 images, étincelles, câbles qui jaillissent, caméra qui tremble 8 images. |
| 6,5 à 8,7 s | 195-261 | Ralenti : l'œil vacille, les moitiés se désintègrent en pixels qui montent. L'épée revient en position, le tranchant s'apaise. |
| 8,7 à 10 s | 261-300 | Un nouveau robot se matérialise par balayage de lignes (scanline) à la place de l'ancien, œil sombre : raccord avec l'image 0. |

## Mouvement (tout boucle)
1. Lent et large : brume cyan au sol, 1 traversée ; poutres du fond, dérive de 3 px.
2. Moyen : l'épée flotte, ±3 px, 2 cycles ; ventilateur de la garde, 6 tours.
3. Moyen : respiration du robot (torse ±1 px), 3 cycles, avant l'attaque.
4. Rapide et petit : voyants des serveurs, 1 à 4 clignotements chacun ; étincelles, 40 particules ; scintillement du tranchant le long du fil, 5 cycles.
5. Événement : le coup, avec hit stop, flash, onde de choc et tremblement de caméra.
6. Événement rare, pour le 2e visionnage : un voyant orange dans les serveurs du fond clignote juste après le coup, comme une alarme.

## Caméra
Fixe pendant l'attaque. Dérive lente en ellipse de ±4 px sur 10 s (plan 7 le plus mobile). Au coup : tremblement de ±3 px, 8 images, décroissant. Pas de zoom.

## Texte
« L'ÉPÉE » (taille 1, blanc cassé), « CARTE MÈRE » (taille 2, cyan), « TRANCHE TOUT » (taille 2, orange). Contour noir, ombre noire. Entre 13 % et 30 % de la hauteur.

## Critères de refus
- La lame ressemble à un rectangle vert sans pistes, ni processeur, ni connecteur dorés.
- Le coup n'a pas de poids : pas d'arrêt sur image, pas de flash, pas de tremblement.
- La ligne de coupe se confond avec le reste du robot au lieu d'être le point le plus chaud et le plus contrasté.
- Le robot est un bloc gris sans silhouette lisible, ou ressemble à un personnage connu.
- Un saut est visible au raccord de la boucle.
