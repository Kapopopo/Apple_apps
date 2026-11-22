import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering } from 'react-native-purchases';
import { appConfig } from '@/config/app';
import { texts } from '@/config/texts';
import { apiKey, purchasesMode, type PurchasesMode } from './mode';
import { mockPlans, storePlans, type Plan } from './plans';

interface Premium {
  mode: PurchasesMode;
  isPremium: boolean;
  /** true tant que le statut de l'abonnement est inconnu. */
  loading: boolean;
  managementUrl: string | null;
  plans: Plan[];
  plansLoading: boolean;
  offering: PurchasesOffering | null;
  /** Chaque action renvoie un message à afficher, ou null. */
  purchase(plan: Plan): Promise<string | null>;
  restore(): Promise<string>;
  refresh(): Promise<void>;
  reloadPlans(): Promise<void>;
  applyCustomerInfo(info: CustomerInfo): void;
}

const MOCK_KEY = 'mobile-base/mock-premium';
const PremiumContext = createContext<Premium | null>(null);

const hasEntitlement = (info: CustomerInfo) => info.entitlements.active[appConfig.revenueCat.entitlement] !== undefined;

let configured = false;
function configure() {
  if (configured) return;
  Purchases.configure({ apiKey });
  configured = true;
}

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [managementUrl, setManagementUrl] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setPremium(hasEntitlement(info));
    setManagementUrl(info.managementURL);
  }, []);

  const refresh = useCallback(async () => {
    try {
      if (purchasesMode === 'mock') setPremium((await AsyncStorage.getItem(MOCK_KEY)) === '1');
      else if (purchasesMode === 'store') {
        configure();
        applyCustomerInfo(await Purchases.getCustomerInfo());
      } else setPremium(false);
    } catch (error) {
      // Hors ligne : le SDK sert son cache ; sans cache, le dernier statut connu est gardé.
      console.warn('Statut de l’abonnement indisponible', error);
    } finally {
      setLoading(false);
    }
  }, [applyCustomerInfo]);

  const reloadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      if (purchasesMode === 'mock') setPlans(mockPlans());
      else if (purchasesMode === 'store') {
        configure();
        const loaded = await storePlans();
        setPlans(loaded.plans);
        setOffering(loaded.offering);
      }
    } catch (error) {
      console.warn('Offres indisponibles', error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void reloadPlans();
    if (purchasesMode !== 'store') return;
    // Renouvellement, expiration ou remboursement survenus pendant que l'app tournait.
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      Purchases.removeCustomerInfoUpdateListener(applyCustomerInfo);
      foreground.remove();
    };
  }, [refresh, reloadPlans, applyCustomerInfo]);

  const purchase = async (plan: Plan) => {
    try {
      if (purchasesMode === 'mock') {
        await AsyncStorage.setItem(MOCK_KEY, '1');
        setPremium(true);
        return null;
      }
      if (purchasesMode !== 'store' || !plan.pkg) return texts.purchases.unconfigured;
      const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
      applyCustomerInfo(customerInfo);
      return hasEntitlement(customerInfo) ? null : texts.purchases.inactive;
    } catch (error) {
      return (error as { userCancelled?: boolean | null }).userCancelled ? null : texts.purchases.failed;
    }
  };

  const restore = async () => {
    try {
      let active = false;
      if (purchasesMode === 'mock') {
        active = (await AsyncStorage.getItem(MOCK_KEY)) === '1';
        setPremium(active);
      } else if (purchasesMode === 'store') {
        const info = await Purchases.restorePurchases();
        applyCustomerInfo(info);
        active = hasEntitlement(info);
      } else return texts.purchases.unconfigured;
      return active ? texts.purchases.restored : texts.purchases.nothingToRestore;
    } catch {
      return texts.purchases.failed;
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        mode: purchasesMode,
        isPremium,
        loading,
        managementUrl,
        plans,
        plansLoading,
        offering,
        purchase,
        restore,
        refresh,
        reloadPlans,
        applyCustomerInfo,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

/** Statut de l'abonnement et actions d'achat : `const { isPremium } = usePremium();` */
export function usePremium(): Premium {
  const premium = useContext(PremiumContext);
  if (!premium) throw new Error('usePremium doit être utilisé sous <PremiumProvider>.');
  return premium;
}
