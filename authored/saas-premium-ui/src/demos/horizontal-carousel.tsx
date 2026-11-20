import { CarouselItem, HorizontalCarousel } from '@/components/horizontal-carousel';

export default function HorizontalCarouselDemo() {
  return (
    <div className="pl-root w-full max-w-5xl overflow-hidden rounded-pl-xl px-5 py-8">
      <HorizontalCarousel label="Exemples">
        {Array.from({ length: 8 }, (_, i) => (
          <CarouselItem key={i}>
            <div className="flex h-56 w-[72vw] max-w-[280px] flex-col justify-end rounded-pl-lg border border-pl-border bg-pl-card p-4 shadow-pl-card">
              <div className="pl-placeholder mb-auto h-28 rounded-pl-md" />
              <p className="text-sm font-semibold">Carte {i + 1}</p>
              <p className="text-xs text-pl-fg-3">Déborde du bord sur mobile</p>
            </div>
          </CarouselItem>
        ))}
      </HorizontalCarousel>
    </div>
  );
}
