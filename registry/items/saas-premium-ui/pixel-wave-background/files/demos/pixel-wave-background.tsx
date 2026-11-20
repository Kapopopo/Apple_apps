import { PixelWaveBackground } from '@/components/pixel-wave-background';

export default function PixelWaveBackgroundDemo() {
  return (
    <PixelWaveBackground className="pl-root pl-dark w-full max-w-4xl rounded-pl-xl bg-pl-ink-dark">
      <div className="grid h-[380px] place-items-center text-center">
        <p className="pl-display text-4xl text-white sm:text-6xl">Vagues de pixels</p>
      </div>
    </PixelWaveBackground>
  );
}
