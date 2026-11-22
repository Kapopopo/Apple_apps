import { ActivityIndicator } from 'react-native';
import { appConfig } from '@/config/app';
import { CustomPaywall } from '@/features/paywall/custom-paywall';
import { RevenueCatPaywall } from '@/features/paywall/revenuecat-paywall';
import { usePremium } from '@/features/premium';

export default function Paywall() {
  const { mode, offering, plansLoading } = usePremium();
  if (mode === 'store' && appConfig.revenueCat.useDashboardPaywall) {
    if (plansLoading) return <ActivityIndicator className="flex-1 bg-background text-primary" />;
    if (offering) return <RevenueCatPaywall offering={offering} />;
  }
  return <CustomPaywall />;
}
