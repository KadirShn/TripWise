import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { differenceInCalendarDays } from 'date-fns';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  MoneyText,
  Screen,
  Skeleton,
} from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatShortDate } from '@/utils/dates/format';
import { TripCoverEmoji } from './trip-cover-emoji';

export function TripsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { trips, expenses, isLoading, error, refetch } = useTripData();
  const { colors } = useAppTheme();
  if (isLoading)
    return (
      <Screen>
        <Skeleton height={48} />
        <Skeleton height={170} />
        <Skeleton height={170} />
      </Screen>
    );
  if (error)
    return (
      <Screen>
        <ErrorState
          title={t('common.error')}
          description={t('auth.genericError')}
          retryLabel={t('common.retry')}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  return (
    <Screen>
      {trips.length === 0 ? (
        <EmptyState
          title={t('trips.emptyTitle')}
          description={t('trips.emptyDescription')}
          actionLabel={t('trips.new')}
          onAction={() => router.push('/trip/new')}
        />
      ) : (
        <>
          <Button label={t('trips.new')} icon="plus" onPress={() => router.push('/trip/new')} />
          {trips.map((trip) => {
            const total = expenses
              .filter((expense) => expense.tripId === trip.id)
              .reduce(
                (sum, expense) =>
                  sum +
                  Math.round((expense.amountMinor * expense.exchangeRateMillionths) / 1_000_000),
                0,
              );
            const days =
              differenceInCalendarDays(
                new Date(`${trip.endDate}T00:00:00`),
                new Date(`${trip.startDate}T00:00:00`),
              ) + 1;
            return (
              <Link
                key={trip.id}
                href={{ pathname: '/trip/[tripId]', params: { tripId: trip.id } }}
                asChild
              >
                <Pressable>
                  <Card style={{ overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <TripCoverEmoji emoji={trip.coverEmoji} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="subtitle">{trip.title}</AppText>
                        <AppText style={{ color: colors.textMuted }}>{trip.destination}</AppText>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={26}
                        color={colors.textMuted}
                      />
                    </View>
                    <View style={{ height: 1, backgroundColor: colors.border }} />
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: spacing.md,
                      }}
                    >
                      <View>
                        <AppText variant="caption" style={{ color: colors.textMuted }}>
                          {formatShortDate(trip.startDate, i18n.language)} ·{' '}
                          {t('trips.days', { count: days })}
                        </AppText>
                      </View>
                      <MoneyText
                        amountMinor={total}
                        currency={trip.baseCurrency}
                        style={{ fontWeight: '800' }}
                      />
                    </View>
                  </Card>
                </Pressable>
              </Link>
            );
          })}
        </>
      )}
    </Screen>
  );
}
