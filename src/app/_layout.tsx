import '@/lib/i18n';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/features/auth/auth-provider';
import { QueryProvider } from '@/lib/query/query-provider';
import { useAppTheme } from '@/theme/use-app-theme';

export { ErrorBoundary } from '@/components/root-error-boundary';

export default function RootLayout() {
  const { isDark, colors } = useAppTheme();
  const { t } = useTranslation();
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
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
