import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, Card, MoneyText, Screen } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function OverviewScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { trips, expenses, itineraryItems: items } = useTripData();
  const total = expenses.reduce(
    (sum, e) => sum + Math.round((e.amountMinor * e.exchangeRateMillionths) / 1_000_000),
    0,
  );
  const next = [...items]
    .filter((i) => new Date(i.startsAt) > new Date())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Card style={{ flex: 1 }}>
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('overview.activeTrips')}
          </AppText>
          <AppText variant="display">{trips.length}</AppText>
        </Card>
        <Card style={{ flex: 1 }}>
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('overview.totalSpent')}
          </AppText>
          <MoneyText
            amountMinor={total}
            currency={trips[0]?.baseCurrency ?? 'TRY'}
            style={{ fontSize: 20, fontWeight: '800' }}
          />
        </Card>
      </View>
      <Card>
        <AppText variant="subtitle">{t('overview.nextPlan')}</AppText>
        {next ? (
          <>
            <AppText variant="title">{next.title}</AppText>
            <AppText style={{ color: colors.textMuted }}>
              {format(new Date(next.startsAt), 'dd.MM.yyyy HH:mm')}
            </AppText>
          </>
        ) : (
          <AppText style={{ color: colors.textMuted }}>{t('overview.noPlan')}</AppText>
        )}
      </Card>
    </Screen>
  );
}
