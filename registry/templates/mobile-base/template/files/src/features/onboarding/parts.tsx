import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { texts } from '@/config/texts';
import { cn } from '@/lib/utils';

export interface StepProps {
  step: number;
  total: number;
  canContinue?: boolean;
  onBack(): void;
  onNext(): void;
}

export function StepHeader({ step, total, onBack, onPrimary = false }: StepProps & { onPrimary?: boolean }) {
  return (
    <View className="min-h-14 flex-row items-center gap-stack px-gutter">
      {step > 0 ? (
        <Button testID="onboarding-back" size="icon" variant="link" accessibilityLabel={texts.onboarding.back} onPress={onBack}>
          <Icon as={ArrowLeft} className={onPrimary ? 'text-primary-foreground' : 'text-foreground'} />
        </Button>
      ) : null}
      <View accessible role="progressbar" accessibilityLabel={texts.onboarding.progress(step + 1, total)} className="flex-1 flex-row gap-1">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full',
              onPrimary ? (i <= step ? 'bg-primary-foreground' : 'bg-primary-foreground/30') : i <= step ? 'bg-primary' : 'bg-border',
            )}
          />
        ))}
      </View>
    </View>
  );
}

export function StepFooter({ step, total, canContinue = true, onNext, onPrimary = false }: StepProps & { onPrimary?: boolean }) {
  return (
    <View className="px-gutter pb-pad pt-tight">
      <Button testID="onboarding-next" size="lg" variant={onPrimary ? 'inverse' : 'default'} disabled={!canContinue} onPress={onNext}>
        <Text>{step === total - 1 ? texts.onboarding.finish : texts.onboarding.next}</Text>
      </Button>
    </View>
  );
}
