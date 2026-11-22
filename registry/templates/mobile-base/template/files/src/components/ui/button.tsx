// react-native-reusables (MIT, voir THIRD_PARTY_LICENSES.txt), adapté : tokens du thème, cibles tactiles de 44 pt.
import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable } from 'react-native';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const buttonVariants = cva('shrink-0 flex-row items-center justify-center gap-2 rounded-lg', {
  variants: {
    variant: {
      default: 'bg-primary active:bg-primary/90',
      inverse: 'bg-primary-foreground active:bg-primary-foreground/90',
      destructive: 'bg-destructive active:bg-destructive/90',
      outline: 'border border-border bg-background active:bg-accent',
      secondary: 'bg-secondary active:bg-secondary/80',
      ghost: 'active:bg-accent',
      link: '',
    },
    size: {
      default: 'min-h-12 px-4 py-2',
      sm: 'min-h-11 px-3',
      lg: 'min-h-14 px-6 py-3',
      icon: 'h-11 w-11',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('font-medium text-center text-foreground', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      inverse: 'text-primary',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary',
    },
    size: { default: '', sm: 'text-sm', lg: 'font-semibold text-lg', icon: '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type ButtonProps = React.ComponentProps<typeof Pressable> & React.RefAttributes<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable className={cn(buttonVariants({ variant, size }), props.disabled && 'opacity-50', className)} role="button" {...props} />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
