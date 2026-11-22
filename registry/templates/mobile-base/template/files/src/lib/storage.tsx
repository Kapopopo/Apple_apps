import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Answers = Record<string, string[]>;

interface Saved {
  onboarded: boolean;
  answers: Answers;
}

interface Store extends Saved {
  ready: boolean;
  completeOnboarding(answers: Answers): Promise<void>;
  /** Efface tout le stockage local, y compris celui de la fonctionnalité. Rejette si l'effacement échoue. */
  reset(): Promise<void>;
}

const KEY = 'mobile-base/state';
const EMPTY: Saved = { onboarded: false, answers: {} };
const StoreContext = createContext<Store | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const value: Partial<Saved> | null = raw ? JSON.parse(raw) : null;
        setSaved({ onboarded: value?.onboarded === true, answers: value?.answers ?? {} });
      })
      .catch((error) => console.warn('Lecture du stockage local impossible', error))
      .finally(() => setReady(true));
  }, []);

  const completeOnboarding = async (answers: Answers) => {
    const next = { onboarded: true, answers };
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch (error) {
      // Le parcours continue en mémoire : il ne doit pas rester bloqué sur le dernier écran.
      console.warn('Écriture du stockage local impossible', error);
    }
    setSaved(next);
  };

  const reset = async () => {
    const keys = await AsyncStorage.getAllKeys();
    // multiRemove plutôt que clear() : clear() échoue sur iOS quand le stockage est déjà vide.
    if (keys.length) await AsyncStorage.multiRemove(keys);
    setSaved(EMPTY);
  };

  return <StoreContext.Provider value={{ ...saved, ready, completeOnboarding, reset }}>{children}</StoreContext.Provider>;
}

export function useStorage(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStorage doit être utilisé sous <StorageProvider>.');
  return store;
}

/** Réponses aux questions de l'onboarding, pour personnaliser l'app : `useAnswers().objectif`. */
export const useAnswers = (): Answers => useStorage().answers;
