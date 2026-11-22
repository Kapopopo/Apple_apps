import Check from 'lucide-react-native/icons/check';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { texts } from '@/config/texts';
import type { OnboardingQuestion } from '@/config/types';
import { cn } from '@/lib/utils';
import { StepFooter, StepHeader, type StepProps } from './parts';

interface Props extends StepProps {
  question: OnboardingQuestion;
  value: string[];
  onChange(value: string[]): void;
}

export function Question({ question, value, onChange, ...nav }: Props) {
  const toggle = (option: string) => {
    if (!question.multiple) onChange([option]);
    else onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };
  return (
    <SafeAreaView testID="onboarding-question" className="flex-1 bg-background">
      <StepHeader {...nav} />
      <ScrollView contentContainerClassName="grow gap-stack px-gutter py-section">
        <Text variant="h2">{question.title}</Text>
        <Text variant="muted">{question.multiple ? texts.onboarding.multiple : texts.onboarding.single}</Text>
        <View role={question.multiple ? 'group' : 'radiogroup'} className="gap-tight">
          {question.options.map((option, i) => {
            const checked = value.includes(option);
            return (
              <Pressable
                key={option}
                testID={`answer-${i}`}
                role={question.multiple ? 'checkbox' : 'radio'}
                aria-checked={checked}
                onPress={() => toggle(option)}
                className={cn(
                  'min-h-14 flex-row items-center gap-stack rounded-lg border-2 p-pad',
                  checked ? 'border-primary bg-accent' : 'border-border bg-card',
                )}
              >
                <Text className={cn('flex-1', checked ? 'font-semibold text-accent-foreground' : 'text-card-foreground')}>{option}</Text>
                {checked ? <Icon as={Check} className="text-primary" /> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <StepFooter {...nav} canContinue={value.length > 0} />
    </SafeAreaView>
  );
}
