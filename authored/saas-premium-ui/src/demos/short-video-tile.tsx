import { ShortVideoTile } from '@/components/short-video-tile';

export default function ShortVideoTileDemo() {
  return (
    <div className="pl-root pl-dark flex w-full max-w-3xl flex-wrap justify-center gap-3 rounded-pl-xl bg-pl-ink-dark p-6">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="block h-[213px] w-[120px]">
          <ShortVideoTile index={i} photo={i * 5} />
        </span>
      ))}
    </div>
  );
}
