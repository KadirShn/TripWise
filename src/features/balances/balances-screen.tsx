import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText, Avatar, Card, MoneyText, Screen } from '@/components/ui';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { calculateBalances, simplifySettlements } from '@/utils/settlement/balances';
import { useLocalTrip } from '@/features/trips/use-local-trip';

export function BalancesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const bundle = useLocalTrip(tripId);
  const { t } = useTranslation();
  const { colors } = useAppTheme();
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
      <AppText style={{ color: colors.textMuted }}>{t('balances.explanation')}</AppText>
      <Card>
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
          <Card key={`${settlement.fromMemberId}-${settlement.toMemberId}-${index}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <MaterialCommunityIcons name="bank-transfer" size={30} color={colors.primary} />
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
