import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { useAppTheme } from '@/theme/use-app-theme';
export function TripSettingsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const remove = data.deleteTrip;
  const { colors } = useAppTheme();
  if (!trip) return null;
  const confirmDelete = () =>
    Alert.alert(t('trips.deleteTitle'), t('trips.deleteDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void remove(tripId)
            .then(() => router.replace('/(tabs)/(trips)'))
            .catch(() => Alert.alert(t('common.error'), t('auth.genericError')));
        },
      },
    ]);
  return (
    <Screen>
      <Card>
        <AppText variant="title">{trip.title}</AppText>
        <AppText style={{ color: colors.textMuted }}>{trip.destination}</AppText>
      </Card>
      <Button
        label={t('common.edit')}
        icon="pencil-outline"
        onPress={() => router.push(`/trip/${tripId}/edit` as never)}
      />
      <Button
        variant="danger"
        label={t('common.delete')}
        icon="trash-can-outline"
        onPress={confirmDelete}
      />
    </Screen>
  );
}
