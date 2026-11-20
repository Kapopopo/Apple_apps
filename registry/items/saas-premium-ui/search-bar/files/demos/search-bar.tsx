import { SearchBar } from '@/components/search-bar';

export default function SearchBarDemo() {
  return (
    <div className="pl-root flex w-full max-w-3xl flex-col items-center gap-6">
      <div className="pl-dark grid w-full place-items-center rounded-pl-xl bg-pl-ink-dark px-4 py-12">
        <SearchBar />
      </div>
      <SearchBar tone="light" suggestions={['modèle de facture', 'planning hebdo']} />
    </div>
  );
}
