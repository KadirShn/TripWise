import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { useAppTheme } from '@/theme/use-app-theme';
export function TripSettingsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const remove = data.deleteTrip;
  const { colors } = useAppTheme();
  const [isDeleting, setDeleting] = useState(false);
  if (data.isLoading) return <TripDataLoadingScreen />;
  if (data.error) return <TripDataErrorScreen onRetry={() => void data.refetch()} />;
  if (!trip) return null;
  const confirmDelete = () =>
    Alert.alert(t('trips.deleteTitle'), t('trips.deleteDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          if (isDeleting) return;
          setDeleting(true);
          void remove(tripId)
            .then(() => router.replace('/(tabs)/(trips)'))
            .catch((error) => Alert.alert(t('common.error'), t(getTripDataErrorKey(error))))
            .finally(() => setDeleting(false));
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
        disabled={isDeleting}
        onPress={() => router.push(`/trip/${tripId}/edit` as never)}
      />
      <Button
        variant="danger"
        label={t('common.delete')}
        icon="trash-can-outline"
        loading={isDeleting}
        onPress={confirmDelete}
      />
    </Screen>
  );
}
