import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AppText, Card, EmptyState, MoneyText, ProgressBar, Screen } from '@/components/ui';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import type { ExpenseCategory } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatDateOnly } from '@/utils/dates/format';
import { TripCoverEmoji } from './trip-cover-emoji';
import { useLocalTrip } from './use-local-trip';

const categoryKeys: ExpenseCategory[] = [
  'accommodation',
  'transport',
  'food',
  'activity',
  'shopping',
  'other',
];
export function TripDashboardScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { bundle, isLoading, error, refetch } = useLocalTrip(tripId);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  if (isLoading) return <TripDataLoadingScreen />;
  if (error) return <TripDataErrorScreen onRetry={() => void refetch()} />;
  if (!bundle)
    return (
      <Screen>
        <EmptyState
          title={t('status.notFound')}
          description={t('auth.genericError')}
          actionLabel={t('status.goHome')}
          onAction={() => router.replace('/(tabs)/(trips)')}
        />
      </Screen>
    );
  const { trip, members, expenses, itineraryItems } = bundle;
  const total = expenses.reduce(
    (sum, e) => sum + Math.round((e.amountMinor * e.exchangeRateMillionths) / 1_000_000),
    0,
  );
  const budget = trip.budgetAmountMinor;
  const categories = categoryKeys
    .map((category) => ({
      category,
      amount: expenses
        .filter((e) => e.category === category)
        .reduce(
          (sum, e) => sum + Math.round((e.amountMinor * e.exchangeRateMillionths) / 1_000_000),
          0,
        ),
    }))
    .filter((item) => item.amount > 0);
  const actions = [
    ['receipt-text-outline', t('dashboard.expenses'), 'expenses'],
    ['account-group-outline', t('dashboard.participants'), 'participants'],
    ['scale-balance', t('dashboard.balances'), 'balances'],
    ['map-clock-outline', t('dashboard.itinerary'), 'itinerary'],
  ] as const;
  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <TripCoverEmoji emoji={trip.coverEmoji} size={68} />
        <AppText variant="display">{trip.title}</AppText>
        <AppText style={{ color: colors.textMuted }}>
          {trip.destination} · {formatDateOnly(trip.startDate, i18n.language)} —{' '}
          {formatDateOnly(trip.endDate, i18n.language)}
        </AppText>
      </View>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
          <View>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('dashboard.spent')}
            </AppText>
            <MoneyText
              amountMinor={total}
              currency={trip.baseCurrency}
              style={{ fontSize: 28, fontWeight: '800' }}
            />
          </View>
          {budget !== null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="caption" style={{ color: colors.textMuted }}>
                {total > budget ? t('dashboard.overBudget') : t('dashboard.remaining')}
              </AppText>
              <MoneyText
                amountMinor={Math.abs(budget - total)}
                currency={trip.baseCurrency}
                style={{
                  color: total > budget ? colors.danger : colors.success,
                  fontWeight: '700',
                }}
              />
            </View>
          ) : null}
        </View>
        {budget !== null ? (
          <ProgressBar value={total / budget} accessibilityLabel={t('trips.budget')} />
        ) : (
          <AppText style={{ color: colors.textMuted }}>{t('dashboard.noBudget')}</AppText>
        )}
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {actions.map(([icon, label, path]) => (
          <Pressable
            key={path}
            accessibilityRole="button"
            onPress={() => router.push(`/trip/${tripId}/${path}` as never)}
            style={{ width: '47%', minHeight: 116 }}
          >
            <Card style={{ flex: 1, justifyContent: 'space-between' }}>
              <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
              <AppText variant="label">{label}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>
                {path === 'expenses'
                  ? expenses.length
                  : path === 'participants'
                    ? members.length
                    : path === 'itinerary'
                      ? itineraryItems.length
                      : '→'}
              </AppText>
            </Card>
          </Pressable>
        ))}
      </View>
      {categories.length ? (
        <Card>
          <AppText variant="subtitle">{t('dashboard.categorySummary')}</AppText>
          {categories.map(({ category, amount }) => (
            <View key={category} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText>{t(`expenses.categories.${category}`)}</AppText>
              <MoneyText
                amountMinor={amount}
                currency={trip.baseCurrency}
                style={{ fontWeight: '700' }}
              />
            </View>
          ))}
        </Card>
      ) : null}
      <Pressable onPress={() => router.push(`/trip/${tripId}/settings` as never)}>
        <Card>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AppText variant="label">{t('settings.title')}</AppText>
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.textMuted} />
          </View>
        </Card>
      </Pressable>
    </Screen>
  );
}
