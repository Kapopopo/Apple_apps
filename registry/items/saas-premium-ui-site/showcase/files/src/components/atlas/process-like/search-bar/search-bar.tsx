/**
 * SearchBar : champ de recherche en verre sombre (520×52, rayon 16, fond blanc 6 %, liseré blanc 10 %, flou 10 px),
 * loupe, placeholder qui se tape tout seul en rotation entre plusieurs suggestions, bouton blanc « Chercher »
 * (rayon 11). Le placeholder animé s'arrête dès que l'utilisateur tape, et sous prefers-reduced-motion.
 * Props : suggestions, buttonLabel, onSearch, defaultValue, tone (dark, light), className.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  suggestions?: string[];
  buttonLabel?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
  tone?: 'dark' | 'light';
  label?: string;
  className?: string;
}

function useTypedPlaceholder(words: string[], active: boolean) {
  const [i, setI] = useState(0);
  const [len, setLen] = useState(0);
  const [del, setDel] = useState(false);
  const word = words[i] ?? '';
  useEffect(() => {
    if (!active || !words.length) return;
    const full = len === word.length;
    const t = setTimeout(
      () => {
        if (!del && full) setDel(true);
        else if (del && len === 0) {
          setDel(false);
          setI((n) => (n + 1) % words.length);
        } else setLen((l) => l + (del ? -1 : 1));
      },
      !del && full ? 1600 : del ? 28 : 70,
    );
    return () => clearTimeout(t);
  }, [len, del, word, active, words.length]);
  return active ? word.slice(0, len) : (words[0] ?? '');
}

export function SearchBar({
  suggestions = ['recette rapide', 'routine du matin', 'avant / après', 'astuce productivité'],
  buttonLabel = 'Chercher',
  onSearch,
  defaultValue = '',
  tone = 'dark',
  label = 'Rechercher',
  className,
}: SearchBarProps) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(defaultValue);
  const placeholder = useTypedPlaceholder(suggestions, !reduced && !value);
  const dark = tone === 'dark';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.(value.trim());
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        'flex h-[52px] w-full max-w-[520px] items-center gap-2.5 rounded-[16px] border pr-1.5 pl-[18px] backdrop-blur-[10px]',
        dark ? 'border-white/10 bg-white/[0.06] text-white/60' : 'border-pl-border bg-white text-pl-fg-2 shadow-pl-xs',
        className,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <input
        aria-label={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none',
          dark ? 'text-white placeholder:text-white/60' : 'text-pl-fg placeholder:text-pl-fg-3',
        )}
      />
      <button
        type="submit"
        className={cn(
          'h-10 shrink-0 rounded-[11px] px-4 text-[14px] font-semibold transition-transform duration-150 active:scale-[0.97]',
          dark ? 'bg-white text-pl-ink' : 'bg-pl-ink text-white',
        )}
      >
        {buttonLabel}
      </button>
    </form>
  );
}

export default SearchBar;
