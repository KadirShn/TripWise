import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import type { TripBundle } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { buildExpensesCsv, buildTripReportHtml, exportFileName } from './trip-export';

type ExportKind = 'csv' | 'pdf';

export function ExportCard({ bundle }: { bundle: TripBundle }) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const run = async (kind: ExportKind) => {
    if (busy) return;
    setBusy(kind);
    setErrorKey(null);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        setErrorKey('export.unavailable');
        return;
      }
      const file = new File(Paths.cache, exportFileName(bundle.trip.title, kind));
      if (file.exists) file.delete();
      if (kind === 'csv') {
        file.create();
        file.write(buildExpensesCsv(bundle, t, i18n.language));
      } else {
        const printed = await Print.printToFileAsync({
          html: buildTripReportHtml(bundle, t, i18n.language),
        });
        await new File(printed.uri).move(file);
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: kind === 'csv' ? 'text/csv' : 'application/pdf',
        UTI: kind === 'csv' ? 'public.comma-separated-values-text' : 'com.adobe.pdf',
        dialogTitle: t('export.title'),
      });
    } catch (error) {
      if (__DEV__) console.info('[TripWise] Export failed', error);
      setErrorKey('export.failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <AppText variant="subtitle">{t('export.title')}</AppText>
      <AppText style={{ color: colors.textMuted }}>{t('export.description')}</AppText>
      <View style={{ gap: spacing.sm }}>
        <Button
          variant="secondary"
          icon="file-delimited-outline"
          label={t('export.csv')}
          loading={busy === 'csv'}
          disabled={busy !== null}
          onPress={() => void run('csv')}
        />
        <Button
          variant="secondary"
          icon="file-pdf-box"
          label={t('export.pdf')}
          loading={busy === 'pdf'}
          disabled={busy !== null}
          onPress={() => void run('pdf')}
        />
      </View>
      {errorKey ? <AppText style={{ color: colors.danger }}>{t(errorKey)}</AppText> : null}
    </Card>
  );
}
