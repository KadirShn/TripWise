import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import {
  AppText,
  Card,
  EmptyState,
  MoneyText,
  ProgressBar,
  Screen,
  SectionHeading,
} from '@/components/ui';
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
  const actionPalettes = [
    { background: colors.coralSoft, accent: colors.coral },
    { background: colors.skySoft, accent: colors.primary },
    { background: colors.violetSoft, accent: colors.violet },
    { background: colors.mintSoft, accent: colors.mint },
  ];
  return (
    <Screen>
      <View
        style={{
          padding: spacing.xl,
          paddingTop: spacing.xxl,
          borderRadius: 34,
          backgroundColor: colors.navy,
          overflow: 'hidden',
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            position: 'absolute',
            width: 128,
            height: 128,
            borderRadius: 64,
            right: -38,
            top: -44,
            backgroundColor: colors.coral,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <View
            style={{
              width: 82,
              height: 82,
              borderRadius: 26,
              backgroundColor: colors.sun,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: '-4deg' }],
            }}
          >
            <TripCoverEmoji emoji={trip.coverEmoji} size={70} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="display" style={{ color: colors.onNavy }}>
              {trip.title}
            </AppText>
            <AppText style={{ color: '#DCE4F2' }}>{trip.destination}</AppText>
            <AppText variant="caption" style={{ color: '#DCE4F2' }}>
              {formatDateOnly(trip.startDate, i18n.language)} —{' '}
              {formatDateOnly(trip.endDate, i18n.language)}
            </AppText>
          </View>
        </View>
        <View
          style={{
            padding: spacing.lg,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.10)',
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
            <View>
              <AppText variant="caption" style={{ color: '#DCE4F2' }}>
                {t('dashboard.spent')}
              </AppText>
              <MoneyText
                amountMinor={total}
                currency={trip.baseCurrency}
                style={{ color: colors.onNavy, fontSize: 28, lineHeight: 34, fontWeight: '900' }}
              />
            </View>
            {budget !== null ? (
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="caption" style={{ color: '#DCE4F2' }}>
                  {total > budget ? t('dashboard.overBudget') : t('dashboard.remaining')}
                </AppText>
                <MoneyText
                  amountMinor={Math.abs(budget - total)}
                  currency={trip.baseCurrency}
                  style={{
                    color: total > budget ? colors.coral : colors.mint,
                    fontWeight: '900',
                  }}
                />
              </View>
            ) : null}
          </View>
          {budget !== null ? (
            <ProgressBar value={total / budget} accessibilityLabel={t('trips.budget')} />
          ) : (
            <AppText style={{ color: '#DCE4F2' }}>{t('dashboard.noBudget')}</AppText>
          )}
        </View>
      </View>
      <SectionHeading
        title={t('dashboard.quickActions')}
        caption={t('dashboard.quickActionsDescription')}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {actions.map(([icon, label, path], index) => {
          const palette = actionPalettes[index];
          return (
            <Pressable
              key={path}
              accessibilityRole="button"
              onPress={() => router.push(`/trip/${tripId}/${path}` as never)}
              style={({ pressed }) => ({
                width: '47%',
                minHeight: 132,
                padding: spacing.lg,
                borderRadius: 26,
                backgroundColor: palette.background,
                justifyContent: 'space-between',
                opacity: pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 15,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name={icon} size={25} color={palette.accent} />
              </View>
              <View style={{ gap: 2 }}>
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
              </View>
            </Pressable>
          );
        })}
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
