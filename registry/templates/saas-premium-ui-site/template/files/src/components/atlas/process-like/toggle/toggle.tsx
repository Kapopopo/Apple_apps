/**
 * Toggle : interrupteur style iOS, knob en verre qui glisse avec un ressort ; piste bleue quand actif.
 * Contrôlé (`checked` + `onCheckedChange`) ou non (`defaultChecked`). Tons light / dark (piste éteinte).
 */
import { useId, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Toggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  tone = 'light',
  size = 'md',
  disabled,
  className,
}: ToggleProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const id = useId();
  const w = size === 'sm' ? 36 : 46;
  const h = size === 'sm' ? 22 : 28;
  const knob = h - 4;

  const flip = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onCheckedChange?.(!on);
  };

  return (
    <span className={cn('inline-flex items-center gap-3', disabled && 'opacity-50', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={flip}
        style={{ width: w, height: h }}
        className={cn(
          'relative shrink-0 rounded-pl-pill p-0.5 outline-none transition-colors duration-300 ease-pl-out-soft focus-visible:shadow-pl-ring',
          on
            ? 'bg-pl-accent shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)]'
            : tone === 'dark'
              ? 'bg-white/12 shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]'
              : 'bg-[#DCDDE3] shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)]',
        )}
      >
        <motion.span
          animate={{ x: on ? w - knob - 4 : 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.8 }}
          whileTap={{ scaleX: 1.12 }}
          style={{ width: knob, height: knob }}
          className="block rounded-full bg-[linear-gradient(180deg,#fff,#f1f1f4)] shadow-[0_2px_6px_rgb(0_0_0/0.2),inset_0_1px_0_#fff,inset_0_-1px_1px_rgb(0_0_0/0.06)]"
        />
      </button>
      {label && (
        <label htmlFor={id} className="cursor-pointer text-sm select-none">
          {label}
        </label>
      )}
    </span>
  );
}

export default Toggle;
