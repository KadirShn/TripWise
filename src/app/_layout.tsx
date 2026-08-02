import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AuthProvider } from '@/features/auth/auth-provider';
import { i18n } from '@/lib/i18n';
import { QueryProvider } from '@/lib/query/query-provider';
import { useAppStore } from '@/stores/app-store';
import { useAppTheme } from '@/theme/use-app-theme';

export { ErrorBoundary } from '@/components/root-error-boundary';

export default function RootLayout() {
  const { isDark, colors } = useAppTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.coral,
    },
  };
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: 'minimal',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="reset-password"
              options={{ title: t('auth.newPasswordTitle'), headerBackVisible: false }}
            />
            <Stack.Screen name="privacy" options={{ title: t('legal.privacyTitle') }} />
            <Stack.Screen name="delete-account" options={{ title: t('legal.deleteTitle') }} />
            <Stack.Screen
              name="trip/new"
              options={{ presentation: 'modal', title: t('trips.formNew') }}
            />
            <Stack.Screen name="trip/[tripId]" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: t('common.error') }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
