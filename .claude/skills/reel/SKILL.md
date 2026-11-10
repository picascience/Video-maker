---
name: reel
description: Monter une vidéo courte complète (accroche, script, voix off, sous-titres mot à mot, plusieurs plans synchronisés sur la voix) à partir de scènes pixel art, avec Remotion. À utiliser quand la vidéo doit raconter ou expliquer quelque chose, pas seulement boucler.
---

# Du plan qui boucle au reel complet

## 1. Script (avant toute image)

- **Accroche (0 à 2 s)** : une question ou un fait surprenant, 8 mots au plus, écrit à
  l'écran et dit par la voix.
- **Développement** : 3 à 5 phrases courtes, une idée par phrase, un plan par idée.
- **Chute** : réponse nette, puis image finale qui ramène à la première (boucle).
- Durée cible : 20 à 40 s, soit 55 à 110 mots.
- **Vérifier chaque fait** avec une source avant d'écrire, et garder les liens dans
  `projets/<id>/sources.md`. Un chiffre non sourcé ne va pas à l'écran.

## 2. Voix et minutage

1. Générer la voix (ElevenLabs ou enregistrement) → `public/<id>/voix.mp3`.
2. Obtenir le minutage mot à mot (transcription avec horodatage par mot) →
   `projets/<id>/mots.json` : `[{"mot": "Pourquoi", "debut": 0.12, "fin": 0.48}, …]`.
3. Ne jamais deviner les temps : tout déclenchement visuel lit ce fichier.

## 3. Découpage

Un tableau dans `projets/<id>/plan.md` : pour chaque phrase, le mot déclencheur, la
scène (`src/scenes/<id>.ts`), ce qui apparaît ou change sur ce mot, la durée.
Chaque scène suit le parcours brief → code → revue des autres skills.

## 4. Montage dans Remotion

Créer `src/remotion/<Id>Reel.tsx` :

- `<Audio src={staticFile('<id>/voix.mp3')} />`
- Une `<Sequence from={Math.round(debut * fps)}>` par plan, contenant `<PixelScene>`.
- Les changements dans un plan (un objet qui s'allume sur un mot) passent par une
  option de la scène calculée à partir de `mots.json` et de la frame courante.
- **Sous-titres** : 2 à 3 mots à la fois, dessinés dans la grille de pixels avec
  `drawTextCentered` (mot en cours dans la couleur d'accent), entre 62 % et 74 % de la
  hauteur. Pas de texte HTML par-dessus : il casserait le style.
- Transitions : coupe franche sur un mot, ou volet de 4 à 6 images. Pas de fondu lissé.

Enregistrer la composition dans `src/remotion/Root.tsx`, puis
`npm run render -- <Id>Reel out/<id>.mp4`.

## 5. Son

- Voix à −14 LUFS environ, bruitages 8 à 12 dB en dessous.
- Un bruitage par événement visible (apparition, impact), calé sur la même frame.
- Écouter sur haut-parleur de téléphone : les basses disparaissent, les médiums restent.

## 6. Contrôle final

- `npm run qa` sur chaque scène, puis regarder la vidéo entière une fois sans le son et
  une fois avec.
- Première image lisible et accrocheuse seule (elle sert de couverture).
- Rien d'important dans les zones couvertes par l'interface.
