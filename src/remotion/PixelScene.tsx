import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {renderPixels, type Scene} from '../engine';

/**
 * Affiche une scène pixel art dans Remotion.
 * Le canvas a la taille de la grille (ex. 180x320) et il est agrandi en CSS
 * avec `image-rendering: pixelated` : aucun flou, chaque pixel reste un carré net.
 */
export const PixelScene: React.FC<{scene: Scene; text?: boolean}> = ({scene, text = true}) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const px = renderPixels(scene, frame, {text});
    ctx.putImageData(new ImageData(new Uint8ClampedArray(px), scene.width, scene.height), 0, 0);
  }, [frame, scene, text]);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <canvas
        ref={ref}
        width={scene.width}
        height={scene.height}
        style={{width: '100%', height: '100%', imageRendering: 'pixelated'}}
      />
    </AbsoluteFill>
  );
};
