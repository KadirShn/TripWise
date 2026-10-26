import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { getTripDataErrorKey } from '@/features/data/errors';
import { useTripData } from '@/features/data/use-trip-data';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

/** Offers to copy demo trips left on the device into the signed-in account. */
export function GuestImportCard() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { guestTrips, importGuestTrips, discardGuestTrips } = useTripData();
  const [isImporting, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  if (!guestTrips.length) {
    return message && !message.isError ? (
      <AppText style={{ color: colors.success }}>{message.text}</AppText>
    ) : null;
  }
  const runImport = async () => {
    if (isImporting) return;
    setImporting(true);
    setMessage(null);
    try {
      const count = await importGuestTrips();
      setMessage({ text: t('importGuest.success', { count }), isError: false });
    } catch (error) {
      const key = getTripDataErrorKey(error);
      setMessage({
        text: key === 'auth.genericError' ? t('importGuest.failed') : t(key),
        isError: true,
      });
    } finally {
      setImporting(false);
    }
  };
  const confirmDiscard = () =>
    Alert.alert(t('importGuest.discardTitle'), t('importGuest.discardBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: discardGuestTrips },
    ]);
  return (
    <Card style={{ backgroundColor: colors.sunSoft, boxShadow: 'none' }}>
      <AppText variant="subtitle">{t('importGuest.title')}</AppText>
      <AppText style={{ color: colors.textMuted }}>
        {t('importGuest.description', { count: guestTrips.length })}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Button
          icon="cloud-upload-outline"
          label={t('importGuest.action')}
          loading={isImporting}
          onPress={() => void runImport()}
        />
        <Button
          variant="ghost"
          label={t('importGuest.discard')}
          disabled={isImporting}
          onPress={confirmDiscard}
        />
      </View>
      {message ? (
        <AppText style={{ color: message.isError ? colors.danger : colors.success }}>
          {message.text}
        </AppText>
      ) : null}
    </Card>
  );
}
