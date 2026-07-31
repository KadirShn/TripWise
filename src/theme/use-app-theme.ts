import { useColorScheme } from 'react-native';
import { useAppStore } from '@/stores/app-store';
import { darkColors, lightColors } from './theme';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((state) => state.themePreference);
  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark, preference };
}
