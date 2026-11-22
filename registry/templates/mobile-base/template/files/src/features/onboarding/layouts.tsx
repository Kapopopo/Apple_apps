import { StatusBar } from 'expo-status-bar';
import Check from 'lucide-react-native/icons/check';
import type { ComponentType } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Illustration, IllustrationBackdrop } from '@/components/illustration';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { illustrations } from '@/config/illustrations';
import type { AppConfig, OnboardingSlide } from '@/config/types';
import { statusBarOnPrimary, useThemeColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { StepFooter, StepHeader, type StepProps } from './parts';

interface SlideProps extends StepProps {
  slides: OnboardingSlide[];
}

/** Image (ou icône) plein écran, texte en bas. */
function Fullscreen({ slides, ...nav }: SlideProps) {
  const slide = slides[nav.step];
  const colors = useThemeColors();
  return (
    <View testID="onboarding-fullscreen" className="flex-1 bg-primary">
      <StatusBar style={statusBarOnPrimary(colors['primary-foreground'])} />
      <SafeAreaView className="flex-1">
        <StepHeader {...nav} onPrimary />
        <View className="flex-1">
          <IllustrationBackdrop name={slide.illustration} />
        </View>
        <View className="gap-stack px-gutter py-section">
          <Text variant="h1" className="text-primary-foreground">
            {slide.title}
          </Text>
          <Text className="text-lg text-primary-foreground">{slide.text}</Text>
        </View>
        <StepFooter {...nav} onPrimary />
      </SafeAreaView>
    </View>
  );
}

/** Une carte centrée par écran. */
function Cards({ slides, ...nav }: SlideProps) {
  const slide = slides[nav.step];
  return (
    <SafeAreaView testID="onboarding-cards" className="flex-1 bg-muted">
      <StepHeader {...nav} />
      <ScrollView contentContainerClassName="grow justify-center px-gutter py-stack">
        <View className="gap-stack rounded-3xl border border-border bg-card p-gutter">
          <Illustration name={slide.illustration} className="h-56 w-full" />
          <Text variant="h2" className="text-center text-card-foreground">
            {slide.title}
          </Text>
          <Text className="text-center text-muted-foreground">{slide.text}</Text>
        </View>
      </ScrollView>
      <StepFooter {...nav} />
    </SafeAreaView>
  );
}

/** Les étapes s'ajoutent les unes sous les autres. */
function List({ slides, ...nav }: SlideProps) {
  return (
    <SafeAreaView testID="onboarding-list" className="flex-1 bg-background">
      <StepHeader {...nav} />
      <ScrollView contentContainerClassName="grow gap-stack px-gutter py-section">
        {slides.slice(0, nav.step + 1).map((slide, i) => {
          const current = i === nav.step;
          return (
            <View key={i} className={cn('flex-row gap-stack border-b border-border pb-stack', current && 'border-b-0 pt-tight')}>
              <View className={cn('h-12 w-12 items-center justify-center rounded-lg', current ? 'bg-primary' : 'bg-secondary')}>
                <Icon
                  as={current ? illustrations[slide.illustration].icon : Check}
                  size={24}
                  className={current ? 'text-primary-foreground' : 'text-secondary-foreground'}
                />
              </View>
              <View className="flex-1 gap-tight">
                <Text variant={current ? 'h2' : 'large'} className={current ? undefined : 'text-muted-foreground'}>
                  {slide.title}
                </Text>
                {current ? <Text className="text-lg text-muted-foreground">{slide.text}</Text> : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <StepFooter {...nav} />
    </SafeAreaView>
  );
}

export const onboardingLayouts: Record<AppConfig['layouts']['onboarding'], ComponentType<SlideProps>> = {
  fullscreen: Fullscreen,
  cards: Cards,
  list: List,
};
