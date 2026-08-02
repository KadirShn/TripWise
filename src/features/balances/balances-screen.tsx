import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, Avatar, Card, MoneyText, Screen } from '@/components/ui';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { calculateBalances, simplifySettlements } from '@/utils/settlement/balances';
import { useLocalTrip } from '@/features/trips/use-local-trip';

export function BalancesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { bundle, isLoading, error, refetch } = useLocalTrip(tripId);
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  if (isLoading) return <TripDataLoadingScreen />;
  if (error) return <TripDataErrorScreen onRetry={() => void refetch()} />;
  if (!bundle) return null;
  const balances = calculateBalances(
    bundle.members.map((member) => member.id),
    bundle.expenses,
  );
  const settlements = simplifySettlements(balances);
  const memberName = (id: string) =>
    bundle.members.find((member) => member.id === id)?.displayName ?? '—';
  return (
    <Screen>
      <View
        style={{
          padding: spacing.xl,
          borderRadius: 28,
          backgroundColor: colors.violetSoft,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            backgroundColor: colors.violet,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="scale-balance" size={28} color="#FFFFFF" />
        </View>
        <AppText style={{ color: colors.text, flex: 1 }}>{t('balances.explanation')}</AppText>
      </View>
      <Card style={{ backgroundColor: colors.sunSoft, boxShadow: 'none' }}>
        {balances.map((balance) => (
          <View
            key={balance.memberId}
            style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <Avatar name={memberName(balance.memberId)} />
            <View style={{ flex: 1 }}>
              <AppText variant="label">{memberName(balance.memberId)}</AppText>
              <AppText
                variant="caption"
                style={{
                  color:
                    balance.balanceMinor > 0
                      ? colors.success
                      : balance.balanceMinor < 0
                        ? colors.danger
                        : colors.textMuted,
                }}
              >
                {balance.balanceMinor > 0
                  ? t('balances.receives')
                  : balance.balanceMinor < 0
                    ? t('balances.owes')
                    : t('balances.settled')}
              </AppText>
            </View>
            <MoneyText
              amountMinor={Math.abs(balance.balanceMinor)}
              currency={bundle.trip.baseCurrency}
              style={{
                fontWeight: '800',
                color:
                  balance.balanceMinor > 0
                    ? colors.success
                    : balance.balanceMinor < 0
                      ? colors.danger
                      : colors.textMuted,
              }}
            />
          </View>
        ))}
      </Card>
      <AppText variant="title">{t('balances.settlementPlan')}</AppText>
      {settlements.length === 0 ? (
        <Card>
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <MaterialCommunityIcons
              name="check-decagram-outline"
              size={42}
              color={colors.success}
            />
            <AppText variant="subtitle">{t('balances.settled')}</AppText>
          </View>
        </Card>
      ) : (
        settlements.map((settlement, index) => (
          <Card
            key={`${settlement.fromMemberId}-${settlement.toMemberId}-${index}`}
            style={{ backgroundColor: colors.mintSoft, boxShadow: 'none' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="bank-transfer" size={28} color={colors.mint} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label">
                  {t('balances.transfer', {
                    from: memberName(settlement.fromMemberId),
                    to: memberName(settlement.toMemberId),
                  })}
                </AppText>
              </View>
              <MoneyText
                amountMinor={settlement.amountMinor}
                currency={bundle.trip.baseCurrency}
                style={{ fontWeight: '800' }}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
