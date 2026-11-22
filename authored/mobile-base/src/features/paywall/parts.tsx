import Check from 'lucide-react-native/icons/check';
import Settings from 'lucide-react-native/icons/settings';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { appConfig } from '@/config/app';
import { texts } from '@/config/texts';
import type { PlanId } from '@/config/types';
import { usePremium } from '@/features/premium';
import { openLink } from '@/lib/links';
import { cn } from '@/lib/utils';

export interface SelectionProps {
  selected: PlanId;
  onSelect(id: PlanId): void;
}

export function TopBar({ onPrimary = false }: { onPrimary?: boolean }) {
  const router = useRouter();
  const { mode } = usePremium();
  return (
    <View className="flex-row items-center justify-between gap-tight px-pad">
      <Text
        testID={mode === 'mock' ? 'mock-notice' : undefined}
        className={cn('flex-1 text-xs', onPrimary ? 'text-primary-foreground' : 'text-muted-foreground')}
      >
        {mode === 'mock' ? texts.paywall.mock : ''}
      </Text>
      <Button
        testID="paywall-settings"
        size="icon"
        variant="link"
        accessibilityLabel={texts.paywall.settings}
        onPress={() => router.push('/settings')}
      >
        <Icon as={Settings} className={onPrimary ? 'text-primary-foreground' : 'text-muted-foreground'} />
      </Button>
    </View>
  );
}

export function Benefits({ large = false }: { large?: boolean }) {
  return (
    <View className={large ? 'gap-stack' : 'gap-tight'}>
      {appConfig.paywall.benefits.map((benefit) => (
        <View key={benefit} className="flex-row items-center gap-stack">
          <View className={cn('items-center justify-center rounded-full', large ? 'h-9 w-9 bg-primary' : 'h-6 w-6 bg-accent')}>
            <Icon as={Check} size={large ? 20 : 14} className={large ? 'text-primary-foreground' : 'text-primary'} />
          </View>
          <Text className={cn('flex-1', large && 'text-lg')}>{benefit}</Text>
        </View>
      ))}
    </View>
  );
}

/** Modalités de résiliation, en fin de contenu défilant. */
export function CancellationTerms() {
  return (
    <Text className="text-xs text-muted-foreground">
      {Platform.OS === 'android' ? texts.paywall.cancelAndroid : texts.paywall.cancelIos}
    </Text>
  );
}

/** Le montant débité est l'élément de prix le plus visible, devant l'essai (3.1.2). */
export function Plans({ selected, onSelect, columns = false }: SelectionProps & { columns?: boolean }) {
  const { plans, plansLoading, reloadPlans, mode } = usePremium();
  if (plansLoading) return <ActivityIndicator className="py-section text-primary" />;
  if (!plans.length)
    return (
      <View className="gap-tight rounded-lg border border-border bg-card p-pad">
        <Text testID="plans-error" className="text-card-foreground">
          {mode === 'unconfigured' ? texts.purchases.unconfigured : texts.purchases.noPlans}
        </Text>
        {mode === 'store' ? (
          <Button variant="outline" onPress={() => void reloadPlans()}>
            <Text>{texts.paywall.retry}</Text>
          </Button>
        ) : null}
      </View>
    );
  return (
    <View role="radiogroup" className={cn('gap-tight', columns && 'flex-row')}>
      {plans.map((plan) => {
        const checked = plan.id === selected;
        return (
          <Pressable
            key={plan.id}
            testID={`plan-${plan.id}`}
            role="radio"
            aria-checked={checked}
            onPress={() => onSelect(plan.id)}
            className={cn(
              'rounded-xl border-2 py-1.5',
              columns ? 'flex-1 items-center px-1' : 'flex-row items-center justify-between gap-tight px-pad',
              checked ? 'border-primary bg-accent' : 'border-border bg-card',
            )}
          >
            <View className={columns ? 'items-center' : 'shrink'}>
              <Text className="font-semibold text-sm text-foreground">{texts.plan.name[plan.id]}</Text>
              <Text className={cn('text-xs text-muted-foreground', columns && 'text-center')}>{texts.plan.duration[plan.id]}</Text>
            </View>
            <View className={columns ? 'items-center' : 'items-end'}>
              <Text testID={`price-${plan.id}`} className="font-bold text-2xl text-foreground">
                {plan.price}
              </Text>
              <Text className="text-xs text-foreground">{texts.plan.per[plan.id]}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Toujours visible, même sur un petit écran : offres et prix, renouvellement, achat, restauration, liens légaux. */
export function PurchaseFooter({ selected, onSelect, columns }: SelectionProps & { columns?: boolean }) {
  const { plans, purchase, restore } = usePremium();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const plan = plans.find((p) => p.id === selected);

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setMessage(null);
    setMessage(await action());
    setBusy(false);
  };

  return (
    <View className="gap-1.5 border-t border-border bg-background px-gutter pt-tight">
      <Plans selected={selected} onSelect={onSelect} columns={columns} />
      {plan ? (
        <View testID="disclosure">
          <Text className="font-bold text-center text-base text-foreground">
            {texts.paywall.amount(plan.price, texts.plan.per[plan.id])}
          </Text>
          <Text className="text-center text-xs text-muted-foreground">
            {plan.offer ? texts.paywall.renewalAfter(plan.offer) : texts.paywall.renewal}
          </Text>
        </View>
      ) : null}
      <Button testID="subscribe" disabled={busy || !plan} onPress={() => plan && void run(() => purchase(plan))}>
        {busy ? <ActivityIndicator className="text-primary-foreground" /> : <Text>{texts.paywall.subscribe}</Text>}
      </Button>
      {message ? (
        <Text testID="paywall-message" aria-live="polite" className="text-center text-sm text-foreground">
          {message}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap justify-center">
        <Button testID="restore" variant="link" size="sm" className="px-1.5" disabled={busy} onPress={() => void run(restore)}>
          <Text className="text-xs underline">{texts.paywall.restore}</Text>
        </Button>
        <Button
          testID="terms"
          variant="link"
          size="sm"
          className="px-1.5"
          role="link"
          onPress={() => void run(() => openLink(appConfig.termsUrl))}
        >
          <Text className="text-xs underline">{texts.paywall.terms}</Text>
        </Button>
        <Button
          testID="privacy"
          variant="link"
          size="sm"
          className="px-1.5"
          role="link"
          onPress={() => void run(() => openLink(appConfig.privacyUrl))}
        >
          <Text className="text-xs underline">{texts.paywall.privacy}</Text>
        </Button>
      </View>
    </View>
  );
}
