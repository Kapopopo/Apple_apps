import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';
import { useColorScheme } from 'react-native';
import theme from '@/config/theme.json';

/** Tokens bruts, pour ce qui ne prend pas de className (navigation, barre d'état, graphiques). */
export function useThemeColors() {
  return useColorScheme() === 'dark' ? theme.colors.dark : theme.colors.light;
}

export function useNavigationTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  const c = useThemeColors();
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      background: c.background,
      border: c.border,
      card: c.card,
      notification: c.destructive,
      primary: c.primary,
      text: c.foreground,
    },
  };
}

/** Style de barre d'état lisible sur la couleur primaire. */
export function statusBarOnPrimary(primaryForeground: string): 'light' | 'dark' {
  const sum = [1, 3, 5].reduce((total, i) => total + parseInt(primaryForeground.slice(i, i + 2), 16), 0);
  return sum > 382 ? 'light' : 'dark';
}
