import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AppText, MoneyText, Screen, TravelHero } from '@/components/ui';
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
      <TravelHero
        eyebrow={t('overview.title')}
        title={t('overview.heroTitle')}
        description={t('overview.heroDescription')}
      />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            flex: 0.82,
            minHeight: 154,
            padding: spacing.lg,
            borderRadius: 28,
            backgroundColor: colors.violetSoft,
            justifyContent: 'space-between',
          }}
        >
          <MaterialCommunityIcons name="bag-suitcase-outline" size={28} color={colors.violet} />
          <View>
            <AppText variant="display">{activeTrips}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('overview.activeTrips')}
            </AppText>
          </View>
        </View>
        <View
          style={{
            flex: 1.18,
            minHeight: 154,
            padding: spacing.lg,
            borderRadius: 28,
            backgroundColor: colors.sunSoft,
            justifyContent: 'space-between',
          }}
        >
          <MaterialCommunityIcons name="wallet-outline" size={28} color={colors.warning} />
          <View style={{ gap: 2 }}>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('overview.totalSpent')}
            </AppText>
            {Object.entries(totalsByCurrency).length ? (
              Object.entries(totalsByCurrency).map(([currency, amount]) => (
                <MoneyText
                  key={currency}
                  amountMinor={amount}
                  currency={currency}
                  style={{ fontSize: 19, lineHeight: 24, fontWeight: '900' }}
                />
              ))
            ) : (
              <MoneyText
                amountMinor={0}
                currency="TRY"
                style={{ fontSize: 19, fontWeight: '900' }}
              />
            )}
          </View>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!nextTrip}
        onPress={() => nextTrip && router.push(`/trip/${nextTrip.id}` as never)}
      >
        <View
          style={{
            minHeight: 190,
            padding: spacing.xl,
            borderRadius: 30,
            backgroundColor: colors.navy,
            overflow: 'hidden',
            gap: spacing.md,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 110,
              height: 110,
              borderRadius: 55,
              right: -22,
              bottom: -26,
              backgroundColor: colors.coral,
            }}
          />
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <AppText variant="subtitle" style={{ color: colors.onNavy }}>
              {t('overview.upcomingTrip')}
            </AppText>
            <MaterialCommunityIcons name="arrow-top-right" size={24} color={colors.onNavy} />
          </View>
          {nextTrip ? (
            <>
              <AppText style={{ fontSize: 42, lineHeight: 50 }}>{nextTrip.coverEmoji}</AppText>
              <View>
                <AppText variant="title" style={{ color: colors.onNavy }}>
                  {nextTrip.title}
                </AppText>
                <AppText style={{ color: '#DCE4F2' }}>
                  {nextTrip.destination} · {formatDateOnly(nextTrip.startDate, i18n.language)}
                </AppText>
              </View>
            </>
          ) : (
            <AppText style={{ color: '#DCE4F2' }}>{t('overview.noUpcomingTrip')}</AppText>
          )}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={!nextPlan}
        onPress={() => nextPlan && router.push(`/trip/${nextPlan.tripId}/itinerary` as never)}
      >
        <View
          style={{
            padding: spacing.xl,
            borderRadius: 30,
            backgroundColor: colors.skySoft,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.sky,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="map-clock-outline" size={23} color={colors.navy} />
            </View>
            <AppText variant="subtitle">{t('overview.nextPlan')}</AppText>
          </View>
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
        </View>
      </Pressable>
    </Screen>
  );
}
