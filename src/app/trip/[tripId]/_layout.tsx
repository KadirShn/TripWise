import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
export default function TripLayout() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: t('dashboard.title') }} />
      <Stack.Screen name="expenses/index" options={{ title: t('expenses.title') }} />
      <Stack.Screen
        name="expenses/new"
        options={{ title: t('expenses.add'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="expenses/[expenseId]"
        options={{ title: t('expenses.edit'), presentation: 'modal' }}
      />
      <Stack.Screen name="participants" options={{ title: t('participants.title') }} />
      <Stack.Screen name="balances" options={{ title: t('balances.title') }} />
      <Stack.Screen name="itinerary" options={{ title: t('itinerary.title') }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      <Stack.Screen name="edit" options={{ title: t('trips.formEdit'), presentation: 'modal' }} />
    </Stack>
  );
}
