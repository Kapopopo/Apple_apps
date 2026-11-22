import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { appConfig } from '@/config/app';
import { texts } from '@/config/texts';
import { usePremium } from '@/features/premium';
import { contactSupport, manageSubscription, openLink, rateApp } from '@/lib/links';
import { useStorage } from '@/lib/storage';

const t = texts.settings;

function Row({ id, label, onPress, destructive = false }: { id: string; label: string; onPress(): void; destructive?: boolean }) {
  return (
    <Pressable
      testID={`settings-${id}`}
      role="button"
      onPress={onPress}
      className="min-h-14 flex-row items-center justify-between gap-stack border-b border-border py-tight active:bg-accent"
    >
      <Text className={destructive ? 'flex-1 text-destructive' : 'flex-1'}>{label}</Text>
      <Icon as={ChevronRight} className="text-muted-foreground" />
    </Pressable>
  );
}

export default function Settings() {
  const router = useRouter();
  const { mode, isPremium, managementUrl, restore, refresh } = usePremium();
  const { reset } = useStorage();
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const run = async (action: () => Promise<string | null>) => {
    setMessage(null);
    setMessage(await action());
  };

  const erase = async () => {
    try {
      await reset();
      // En mode mock l'achat simulé vient d'être effacé ; en mode store, RevenueCat le garde.
      await refresh();
    } catch {
      setConfirming(false);
      setMessage(t.resetFailed);
    }
  };

  return (
    <SafeAreaView testID="settings" className="flex-1 bg-background">
      <View className="min-h-14 flex-row items-center gap-tight px-pad">
        <Button
          testID="settings-back"
          size="icon"
          variant="ghost"
          accessibilityLabel={t.back}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          <Icon as={ArrowLeft} />
        </Button>
        <Text variant="h3">{t.title}</Text>
      </View>
      <ScrollView contentContainerClassName="px-gutter pb-section">
        <View className="my-stack flex-row items-center justify-between rounded-xl bg-muted p-pad">
          <Text className="font-semibold">{t.status}</Text>
          <Text testID="settings-status">
            {isPremium ? t.active : t.inactive}
            {mode === 'mock' ? ` (${t.mock})` : ''}
          </Text>
        </View>
        {message ? (
          <Text testID="settings-message" aria-live="polite" className="pb-tight text-sm text-foreground">
            {message}
          </Text>
        ) : null}
        <Row id="restore" label={t.restore} onPress={() => void run(restore)} />
        <Row id="manage" label={t.manage} onPress={() => void run(() => manageSubscription(mode, managementUrl))} />
        <Row id="rate" label={t.rate} onPress={() => void run(rateApp)} />
        <Row id="support" label={t.support} onPress={() => void run(contactSupport)} />
        <Row id="terms" label={t.terms} onPress={() => void run(() => openLink(appConfig.termsUrl))} />
        <Row id="privacy" label={t.privacy} onPress={() => void run(() => openLink(appConfig.privacyUrl))} />
        <Row id="reset" label={t.reset} destructive onPress={() => setConfirming(true)} />
        {confirming ? (
          <View role="alert" className="mt-stack gap-stack rounded-xl border border-destructive p-pad">
            <Text>{t.confirmReset}</Text>
            <View className="flex-row gap-tight">
              <Button testID="reset-cancel" variant="outline" className="flex-1" onPress={() => setConfirming(false)}>
                <Text>{t.cancel}</Text>
              </Button>
              <Button testID="reset-confirm" variant="destructive" className="flex-1" onPress={() => void erase()}>
                <Text>{t.erase}</Text>
              </Button>
            </View>
          </View>
        ) : null}
        <Text testID="settings-version" className="pt-section text-center text-xs text-muted-foreground">
          {t.version(Constants.expoConfig?.version ?? appConfig.version)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
