'use client';

import { Canvas } from 'panelui-web/canvas';

export default function CanvasOverview() {
  return (
    <Canvas className="h-[420px] w-full">
      <Canvas.Pattern />
      <Canvas.Spotlight />
    </Canvas>
  );
}
