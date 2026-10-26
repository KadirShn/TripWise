import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { differenceInCalendarDays } from 'date-fns';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  AppText,
  Button,
  EmptyState,
  ErrorState,
  MoneyText,
  Screen,
  SectionHeading,
  Skeleton,
  TravelHero,
} from '@/components/ui';
import { GuestImportCard } from '@/features/data/guest-import-card';
import { useTripData } from '@/features/data/use-trip-data';
import { useAppStore } from '@/stores/app-store';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatShortDate } from '@/utils/dates/format';
import { TripCoverEmoji } from './trip-cover-emoji';

export function TripsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { trips, expenses, isLoading, error, refetch, mode } = useTripData();
  const { colors } = useAppTheme();
  const pendingInviteCode = useAppStore((state) => state.pendingInviteCode);
  const setPendingInviteCode = useAppStore((state) => state.setPendingInviteCode);
  // Resume an invite link that was opened before signing in.
  useEffect(() => {
    if (mode !== 'authenticated' || !pendingInviteCode) return;
    setPendingInviteCode(null);
    router.push({ pathname: '/join/[code]', params: { code: pendingInviteCode } });
  }, [mode, pendingInviteCode, router, setPendingInviteCode]);
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
  const cardPalettes = [
    { background: colors.skySoft, accent: colors.sky },
    { background: colors.violetSoft, accent: colors.violet },
    { background: colors.sunSoft, accent: colors.sun },
    { background: colors.mintSoft, accent: colors.mint },
    { background: colors.coralSoft, accent: colors.coral },
  ];
  return (
    <Screen>
      <TravelHero
        eyebrow={t('onboarding.eyebrow')}
        title={t('trips.heroTitle')}
        description={t('trips.heroDescription')}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button
            label={t('trips.new')}
            icon="plus"
            style={{ backgroundColor: colors.coral }}
            onPress={() => router.push('/trip/new')}
          />
          <Button
            variant="secondary"
            label={t('invites.joinEntry')}
            icon="ticket-confirmation-outline"
            onPress={() => router.push('/join')}
          />
        </View>
      </TravelHero>
      {mode === 'authenticated' ? <GuestImportCard /> : null}
      {trips.length === 0 ? (
        <EmptyState
          title={t('trips.emptyTitle')}
          description={t('trips.emptyDescription')}
          actionLabel={t('trips.new')}
          onAction={() => router.push('/trip/new')}
        />
      ) : (
        <>
          <SectionHeading
            title={t('trips.collectionTitle')}
            caption={t('trips.collectionDescription')}
          />
          {trips.map((trip, index) => {
            const palette = cardPalettes[index % cardPalettes.length];
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
              <Animated.View key={trip.id} entering={FadeInUp.delay(index * 60).duration(280)}>
                <Link href={{ pathname: '/trip/[tripId]', params: { tripId: trip.id } }} asChild>
                  <Pressable
                    style={({ pressed }) => ({
                      borderRadius: 30,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    })}
                  >
                    <View
                      style={{
                        minHeight: 210,
                        padding: spacing.xl,
                        borderRadius: 30,
                        borderCurve: 'continuous',
                        backgroundColor: palette.background,
                        overflow: 'hidden',
                        gap: spacing.md,
                      }}
                    >
                      <View
                        style={{
                          position: 'absolute',
                          width: 118,
                          height: 118,
                          borderRadius: 59,
                          right: -42,
                          top: -42,
                          backgroundColor: palette.accent,
                          opacity: 0.72,
                        }}
                      />
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: colors.surface,
                          }}
                        >
                          <AppText variant="caption">
                            {formatShortDate(trip.startDate, i18n.language)} ·{' '}
                            {t('trips.days', { count: days })}
                          </AppText>
                        </View>
                        <MaterialCommunityIcons
                          name="arrow-top-right"
                          size={24}
                          color={colors.text}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
                        <View
                          style={{
                            width: 68,
                            height: 68,
                            borderRadius: 22,
                            backgroundColor: colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: [{ rotate: '-3deg' }],
                          }}
                        >
                          <TripCoverEmoji emoji={trip.coverEmoji} size={58} />
                        </View>
                        <View style={{ flex: 1, gap: spacing.xs }}>
                          <AppText variant="title">{trip.title}</AppText>
                          <AppText style={{ color: colors.textMuted }}>{trip.destination}</AppText>
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          paddingTop: spacing.sm,
                        }}
                      >
                        <AppText variant="caption" style={{ color: colors.textMuted }}>
                          {t('dashboard.spent')}
                        </AppText>
                        <MoneyText
                          amountMinor={total}
                          currency={trip.baseCurrency}
                          style={{ fontSize: 21, lineHeight: 26, fontWeight: '900' }}
                        />
                      </View>
                    </View>
                  </Pressable>
                </Link>
              </Animated.View>
            );
          })}
        </>
      )}
    </Screen>
  );
}
