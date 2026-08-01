import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AppText, Card, MoneyText, Screen } from '@/components/ui';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { useTripData } from '@/features/data/use-trip-data';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { calendarDateKey, formatDateOnly, formatDateTime } from '@/utils/dates/format';

export function OverviewScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const data = useTripData();
  const { trips, expenses, itineraryItems } = data;

  if (data.isLoading) return <TripDataLoadingScreen />;
  if (data.error) return <TripDataErrorScreen onRetry={() => void data.refetch()} />;

  const today = calendarDateKey(new Date());
  const activeTrips = trips.filter((trip) => trip.endDate >= today).length;
  const totalsByCurrency = trips.reduce<Record<string, number>>((totals, trip) => {
    const tripTotal = expenses
      .filter((expense) => expense.tripId === trip.id)
      .reduce(
        (sum, expense) =>
          sum + Math.round((expense.amountMinor * expense.exchangeRateMillionths) / 1_000_000),
        0,
      );
    totals[trip.baseCurrency] = (totals[trip.baseCurrency] ?? 0) + tripTotal;
    return totals;
  }, {});
  const nextTrip = [...trips]
    .filter((trip) => trip.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const nextPlan = [...itineraryItems]
    .filter((item) => new Date(item.startsAt) > new Date())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const nextPlanTrip = nextPlan ? trips.find((trip) => trip.id === nextPlan.tripId) : undefined;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Card style={{ flex: 1 }}>
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('overview.activeTrips')}
          </AppText>
          <AppText variant="display">{activeTrips}</AppText>
        </Card>
        <Card style={{ flex: 1 }}>
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('overview.totalSpent')}
          </AppText>
          {Object.entries(totalsByCurrency).length ? (
            Object.entries(totalsByCurrency).map(([currency, amount]) => (
              <MoneyText
                key={currency}
                amountMinor={amount}
                currency={currency}
                style={{ fontSize: 20, fontWeight: '800' }}
              />
            ))
          ) : (
            <MoneyText amountMinor={0} currency="TRY" style={{ fontSize: 20, fontWeight: '800' }} />
          )}
        </Card>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!nextTrip}
        onPress={() => nextTrip && router.push(`/trip/${nextTrip.id}` as never)}
      >
        <Card>
          <AppText variant="subtitle">{t('overview.upcomingTrip')}</AppText>
          {nextTrip ? (
            <>
              <AppText variant="title">{nextTrip.title}</AppText>
              <AppText style={{ color: colors.textMuted }}>
                {nextTrip.destination} · {formatDateOnly(nextTrip.startDate, i18n.language)}
              </AppText>
            </>
          ) : (
            <AppText style={{ color: colors.textMuted }}>{t('overview.noUpcomingTrip')}</AppText>
          )}
        </Card>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={!nextPlan}
        onPress={() => nextPlan && router.push(`/trip/${nextPlan.tripId}/itinerary` as never)}
      >
        <Card>
          <AppText variant="subtitle">{t('overview.nextPlan')}</AppText>
          {nextPlan ? (
            <>
              <AppText variant="title">{nextPlan.title}</AppText>
              {nextPlanTrip ? (
                <AppText style={{ color: colors.textMuted }}>
                  {t('overview.planTrip', { trip: nextPlanTrip.title })}
                </AppText>
              ) : null}
              <AppText style={{ color: colors.textMuted }}>
                {formatDateTime(nextPlan.startsAt, i18n.language)}
              </AppText>
            </>
          ) : (
            <AppText style={{ color: colors.textMuted }}>{t('overview.noPlan')}</AppText>
          )}
        </Card>
      </Pressable>
    </Screen>
  );
}
