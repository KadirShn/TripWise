import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppStore } from '@/stores/app-store';
import { useAppTheme } from '@/theme/use-app-theme';

export default function BootstrapRoute() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const mode = useAppStore((state) => state.mode);
  const { isLoading } = useAuth();
  const { colors } = useAppTheme();
  if (!hasHydrated || isLoading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!onboardingCompleted) return <Redirect href="/onboarding" />;
  if (mode === 'none') return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)/(trips)" />;
}
