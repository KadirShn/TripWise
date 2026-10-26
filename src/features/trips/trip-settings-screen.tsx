import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { ExportCard } from '@/features/export/export-card';
import { useAppTheme } from '@/theme/use-app-theme';
import { useLocalTrip } from './use-local-trip';
import { ViewerNotice } from './viewer-notice';

export function TripSettingsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { bundle, isLoading, error, refetch, role } = useLocalTrip(tripId);
  const { deleteTrip, leaveTrip } = useTripData();
  const { colors } = useAppTheme();
  const [isBusy, setBusy] = useState(false);
  if (isLoading) return <TripDataLoadingScreen />;
  if (error) return <TripDataErrorScreen onRetry={() => void refetch()} />;
  if (!bundle) return null;
  const { trip } = bundle;
  const isOwner = role === 'owner';
  const runAndGoHome = (action: () => Promise<void>) => {
    if (isBusy) return;
    setBusy(true);
    void action()
      .then(() => router.replace('/(tabs)/(trips)'))
      .catch((cause: unknown) => Alert.alert(t('common.error'), t(getTripDataErrorKey(cause))))
      .finally(() => setBusy(false));
  };
  const confirmDelete = () =>
    Alert.alert(t('trips.deleteTitle'), t('trips.deleteDescription'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => runAndGoHome(() => deleteTrip(tripId)),
      },
    ]);
  const confirmLeave = () =>
    Alert.alert(t('invites.leaveTitle'), t('invites.leaveBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('invites.leave'),
        style: 'destructive',
        onPress: () => runAndGoHome(() => leaveTrip(tripId)),
      },
    ]);
  return (
    <Screen>
      <Card>
        <AppText variant="title">{trip.title}</AppText>
        <AppText style={{ color: colors.textMuted }}>{trip.destination}</AppText>
      </Card>
      <ExportCard bundle={bundle} />
      {isOwner ? (
        <>
          <Button
            label={t('common.edit')}
            icon="pencil-outline"
            disabled={isBusy}
            onPress={() => router.push(`/trip/${tripId}/edit` as never)}
          />
          <Button
            variant="danger"
            label={t('common.delete')}
            icon="trash-can-outline"
            loading={isBusy}
            onPress={confirmDelete}
          />
        </>
      ) : (
        <>
          <ViewerNotice message={t('permissions.ownerOnly')} />
          <Button
            variant="danger"
            label={t('invites.leave')}
            icon="exit-run"
            loading={isBusy}
            onPress={confirmLeave}
          />
        </>
      )}
    </Screen>
  );
}
