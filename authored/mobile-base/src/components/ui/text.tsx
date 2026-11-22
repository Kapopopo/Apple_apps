// react-native-reusables (MIT, voir THIRD_PARTY_LICENSES.txt), adapté aux tokens de police.
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, type Role } from 'react-native';
import { cn } from '@/lib/utils';

const textVariants = cva('font-sans text-base text-foreground', {
  variants: {
    variant: {
      default: '',
      h1: 'font-display text-4xl',
      h2: 'font-display text-3xl',
      h3: 'font-display text-2xl',
      h4: 'font-display text-xl',
      p: 'leading-7',
      blockquote: 'border-l-2 border-border pl-3',
      code: 'bg-muted font-mono text-sm',
      lead: 'text-xl text-muted-foreground',
      large: 'font-semibold text-lg',
      small: 'font-medium text-sm',
      muted: 'text-sm text-muted-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextVariantProps = VariantProps<typeof textVariants>;
type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = { h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading' };

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> & React.RefAttributes<typeof RNText> & TextVariantProps & { asChild?: boolean }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component className={cn(textVariants({ variant }), textClass, className)} role={variant ? ROLE[variant] : undefined} {...props} />
  );
}

export { Text, TextClassContext };
