/**
 * DarkAccordion : FAQ en items « boutons physiques » sur fond noir. Ouverture par grid-template-rows 0fr → 1fr
 * (500 ms ease-out-expo) + opacité (350 ms) ; l'icône + pivote de 45° pour devenir ×.
 * `multiple` : plusieurs items ouverts à la fois. `tone="light"` : même mécanique sur fond clair.
 */
import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface DarkAccordionProps {
  items: AccordionItem[];
  defaultOpen?: string[];
  multiple?: boolean;
  tone?: 'dark' | 'light';
  className?: string;
}

export function DarkAccordion({ items, defaultOpen = [], multiple = false, tone = 'dark', className }: DarkAccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const base = useId();
  const toggle = (id: string) => setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : multiple ? [...cur, id] : [id]));

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const panel = `${base}-${item.id}`;
        return (
          <div
            key={item.id}
            className={cn(
              'rounded-pl-sm',
              tone === 'dark' ? 'pl-raised text-white' : 'border border-pl-border bg-pl-card text-pl-fg shadow-pl-xs',
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center gap-4 rounded-pl-sm px-4 py-4 text-left text-[15px] font-medium outline-none focus-visible:shadow-pl-ring sm:px-5 sm:text-base"
              >
                <span className="flex-1">{item.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    'relative grid size-7 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-pl-out-expo',
                    tone === 'dark' ? 'bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]' : 'bg-pl-card-2',
                    isOpen && 'rotate-45',
                  )}
                >
                  <span className="absolute h-[1.5px] w-3 rounded-full bg-current" />
                  <span className="absolute h-3 w-[1.5px] rounded-full bg-current" />
                </span>
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              className={cn(
                'grid transition-[grid-template-rows] duration-500 ease-pl-out-expo',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <div
                  className={cn(
                    'px-4 pb-5 text-[15px] leading-relaxed transition-opacity duration-[350ms] sm:px-5',
                    tone === 'dark' ? 'text-white/60' : 'text-pl-fg-2',
                    isOpen ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DarkAccordion;
