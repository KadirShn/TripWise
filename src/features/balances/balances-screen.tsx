import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, View } from 'react-native';
import { AppText, Avatar, Button, Card, MoneyText, Screen } from '@/components/ui';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { useTripData } from '@/features/data/use-trip-data';
import { useLocalTrip } from '@/features/trips/use-local-trip';
import type { SettlementTransfer } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatDateTime } from '@/utils/dates/format';
import { formatMoney } from '@/utils/money/money';
import { calculateBalances, simplifySettlements } from '@/utils/settlement/balances';
import { ViewerNotice } from '@/features/trips/viewer-notice';
import { buildSettlementShareText } from './settlement-share';

export function BalancesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { bundle, isLoading, error, refetch, canEdit } = useLocalTrip(tripId);
  const { recordSettlement, deleteSettlement } = useTripData();
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  if (isLoading) return <TripDataLoadingScreen />;
  if (error) return <TripDataErrorScreen onRetry={() => void refetch()} />;
  if (!bundle) return null;
  const balances = calculateBalances(
    bundle.members.map((member) => member.id),
    bundle.expenses,
    bundle.settlements,
  );
  const transfers = simplifySettlements(balances);
  const payments = bundle.settlements
    .filter((settlement) => settlement.status === 'paid')
    .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt));
  const memberName = (id: string) =>
    bundle.members.find((member) => member.id === id)?.displayName ?? '—';
  const currency = bundle.trip.baseCurrency;
  const transferKey = (transfer: SettlementTransfer) =>
    `${transfer.fromMemberId}-${transfer.toMemberId}`;

  const run = (key: string, action: () => Promise<unknown>) => {
    if (busyKey) return;
    setBusyKey(key);
    void action()
      .catch((cause: unknown) => Alert.alert(t('common.error'), t(getTripDataErrorKey(cause))))
      .finally(() => setBusyKey(null));
  };
  const confirmPaid = (transfer: SettlementTransfer) => {
    const names = { from: memberName(transfer.fromMemberId), to: memberName(transfer.toMemberId) };
    Alert.alert(
      t('balances.markPaidTitle'),
      t('balances.markPaidBody', {
        ...names,
        amount: formatMoney(transfer.amountMinor, currency),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('balances.markPaid'),
          onPress: () =>
            run(transferKey(transfer), () =>
              recordSettlement({
                tripId,
                fromMemberId: transfer.fromMemberId,
                toMemberId: transfer.toMemberId,
                amountMinor: transfer.amountMinor,
                currency,
              }),
            ),
        },
      ],
    );
  };
  const confirmUndo = (settlementId: string) =>
    Alert.alert(t('balances.undoTitle'), t('balances.undoBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('balances.undo'),
        style: 'destructive',
        onPress: () => run(settlementId, () => deleteSettlement(settlementId)),
      },
    ]);
  const share = () =>
    void Share.share({ message: buildSettlementShareText(bundle, transfers, t) }).catch(() =>
      Alert.alert(t('common.error'), t('export.unavailable')),
    );

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
      {canEdit ? null : <ViewerNotice />}
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
                    : t('balances.memberSettled')}
              </AppText>
            </View>
            <MoneyText
              amountMinor={Math.abs(balance.balanceMinor)}
              currency={currency}
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
      {transfers.length === 0 ? (
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
        transfers.map((transfer) => {
          const names = {
            from: memberName(transfer.fromMemberId),
            to: memberName(transfer.toMemberId),
          };
          return (
            <Card
              key={transferKey(transfer)}
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
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="label">{t('balances.transfer', names)}</AppText>
                  <MoneyText
                    amountMinor={transfer.amountMinor}
                    currency={currency}
                    style={{ fontWeight: '800' }}
                  />
                </View>
                {canEdit ? (
                  <Button
                    variant="secondary"
                    icon="check"
                    label={t('balances.markPaid')}
                    accessibilityLabel={t('balances.markPaidLabel', names)}
                    loading={busyKey === transferKey(transfer)}
                    disabled={busyKey !== null}
                    onPress={() => confirmPaid(transfer)}
                  />
                ) : null}
              </View>
            </Card>
          );
        })
      )}
      <Button
        variant="secondary"
        icon="share-variant-outline"
        label={t('balances.share')}
        onPress={share}
      />
      {payments.length ? (
        <>
          <AppText variant="title">{t('balances.paymentsTitle')}</AppText>
          <Card>
            {payments.map((payment) => {
              const names = {
                from: memberName(payment.fromMemberId),
                to: memberName(payment.toMemberId),
              };
              return (
                <View
                  key={payment.id}
                  style={{
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                  }}
                >
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{t('balances.transfer', names)}</AppText>
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      {t('balances.paidOn', {
                        date: formatDateTime(payment.paidAt ?? payment.createdAt, i18n.language),
                      })}
                    </AppText>
                  </View>
                  <MoneyText
                    amountMinor={payment.amountMinor}
                    currency={payment.currency}
                    style={{ fontWeight: '700' }}
                  />
                  {canEdit ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('balances.undoLabel', names)}
                      disabled={busyKey !== null}
                      hitSlop={8}
                      onPress={() => confirmUndo(payment.id)}
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name="undo-variant"
                        size={22}
                        color={busyKey === payment.id ? colors.textMuted : colors.danger}
                      />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
