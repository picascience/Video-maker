import React from 'react';
import {Composition} from 'remotion';
import {scenes} from '../scenes';
import {PixelScene} from './PixelScene';

// Une composition par scène enregistrée dans src/scenes/index.ts.
// Pour ajouter voix off, bruitages ou sous-titres : envelopper <PixelScene>
// dans une composition dédiée avec <Audio> et <Sequence>.
export const Root: React.FC = () => (
  <>
    {scenes.map((scene) => (
      <Composition
        key={scene.id}
        id={scene.id}
        component={PixelScene}
        defaultProps={{scene, text: true}}
        width={scene.width * scene.scale}
        height={scene.height * scene.scale}
        fps={scene.fps}
        durationInFrames={scene.durationInFrames}
      />
    ))}
  </>
);
