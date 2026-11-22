import { StatusBar } from 'expo-status-bar';
import type { ComponentType } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IllustrationBackdrop } from '@/components/illustration';
import { Text } from '@/components/ui/text';
import { appConfig } from '@/config/app';
import type { AppConfig } from '@/config/types';
import { statusBarOnPrimary, useThemeColors } from '@/lib/theme';
import { Benefits, CancellationTerms, PurchaseFooter, TopBar, type SelectionProps } from './parts';

const { title, subtitle, illustration } = appConfig.paywall;

/** Visuel en tête, offres en lignes. */
function ImageHero(props: SelectionProps) {
  const colors = useThemeColors();
  return (
    <View testID="paywall-image" className="flex-1 bg-background">
      <StatusBar style={statusBarOnPrimary(colors['primary-foreground'])} />
      <SafeAreaView edges={['top']} className="bg-primary">
        <TopBar onPrimary />
      </SafeAreaView>
      <ScrollView contentContainerClassName="pb-stack">
        <View className="h-28">
          <IllustrationBackdrop name={illustration} iconSize={40} />
        </View>
        <View className="gap-tight px-gutter pt-tight">
          <Text variant="h3">{title}</Text>
          <Text className="text-sm text-muted-foreground">{subtitle}</Text>
          <Benefits />
          <CancellationTerms />
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} className="bg-background">
        <PurchaseFooter {...props} />
      </SafeAreaView>
    </View>
  );
}

/** Deux cartes d'offres côte à côte. */
function Cards(props: SelectionProps) {
  return (
    <SafeAreaView testID="paywall-cards" className="flex-1 bg-background">
      <TopBar />
      <ScrollView contentContainerClassName="grow justify-center gap-stack px-gutter py-tight">
        <View className="gap-tight">
          <Text variant="h3" className="text-center">
            {title}
          </Text>
          <Text className="text-center text-sm text-muted-foreground">{subtitle}</Text>
        </View>
        <View className="rounded-2xl bg-muted p-pad">
          <Benefits />
        </View>
        <CancellationTerms />
      </ScrollView>
      <PurchaseFooter {...props} columns />
    </SafeAreaView>
  );
}

/** Les avantages d'abord, en grand. */
function BenefitList(props: SelectionProps) {
  return (
    <SafeAreaView testID="paywall-benefits" className="flex-1 bg-background">
      <TopBar />
      <ScrollView contentContainerClassName="grow gap-stack px-gutter py-tight">
        <View className="gap-tight">
          <Text variant="h2">{title}</Text>
          <Text className="text-sm text-muted-foreground">{subtitle}</Text>
        </View>
        <Benefits large />
        <CancellationTerms />
      </ScrollView>
      <PurchaseFooter {...props} />
    </SafeAreaView>
  );
}

export const paywallLayouts: Record<AppConfig['layouts']['paywall'], ComponentType<SelectionProps>> = {
  image: ImageHero,
  cards: Cards,
  benefits: BenefitList,
};
