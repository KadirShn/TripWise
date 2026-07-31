import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: t('auth.signUp') }} />
      <Stack.Screen name="forgot-password" options={{ title: t('auth.resetTitle') }} />
    </Stack>
  );
}
