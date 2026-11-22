import { Component, useState, type ReactNode } from 'react';
import RevenueCatUI from 'react-native-purchases-ui';
import type { PurchasesOffering } from 'react-native-purchases';
import { usePremium } from '@/features/premium';
import { CustomPaywall } from './custom-paywall';

class Fallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? <CustomPaywall /> : this.props.children;
  }
}

export function RevenueCatPaywall({ offering }: { offering: PurchasesOffering }) {
  const { applyCustomerInfo } = usePremium();
  const [dismissed, setDismissed] = useState(false);
  // Le paywall est bloquant : le fermer mène au paywall de secours, pas à l'app.
  if (dismissed) return <CustomPaywall />;
  return (
    <Fallback>
      <RevenueCatUI.Paywall
        style={{ flex: 1 }}
        options={{ offering, displayCloseButton: false }}
        onPurchaseCompleted={({ customerInfo }) => applyCustomerInfo(customerInfo)}
        onRestoreCompleted={({ customerInfo }) => applyCustomerInfo(customerInfo)}
        onDismiss={() => setDismissed(true)}
      />
    </Fallback>
  );
}
