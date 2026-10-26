import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { AppText, Button, Card, EmptyState, MoneyText, Screen } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { formatDateOnly } from '@/utils/dates/format';
import { ViewerNotice } from '@/features/trips/viewer-notice';
import { useState } from 'react';

export function ExpensesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const data = useTripData();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const expenses = data.expenses
    .filter((expense) => expense.tripId === tripId)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  const members = data.members.filter((member) => member.tripId === tripId);
  const remove = data.deleteExpense;
  const canEdit = data.myRole(tripId) !== 'viewer';
  const confirm = (id: string, title: string) =>
    Alert.alert(t('common.delete'), title, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          if (deletingId) return;
          setDeletingId(id);
          void remove(id)
            .catch((error) => Alert.alert(t('common.error'), t(getTripDataErrorKey(error))))
            .finally(() => setDeletingId(null));
        },
      },
    ]);
  if (data.isLoading) return <TripDataLoadingScreen />;
  if (data.error) return <TripDataErrorScreen onRetry={() => void data.refetch()} />;
  return (
    <Screen>
      {canEdit ? (
        <Button
          label={t('expenses.add')}
          icon="plus"
          onPress={() => router.push(`/trip/${tripId}/expenses/new` as never)}
        />
      ) : (
        <ViewerNotice />
      )}
      {expenses.length === 0 ? (
        <EmptyState
          title={t('expenses.emptyTitle')}
          description={t('expenses.emptyDescription')}
          actionLabel={canEdit ? t('expenses.add') : undefined}
          onAction={
            canEdit ? () => router.push(`/trip/${tripId}/expenses/new` as never) : undefined
          }
        />
      ) : (
        expenses.map((expense, index) => {
          const payer = members.find((m) => m.id === expense.paidByMemberId);
          const palette = [
            { background: colors.coralSoft, accent: colors.coral },
            { background: colors.skySoft, accent: colors.primary },
            { background: colors.violetSoft, accent: colors.violet },
            { background: colors.sunSoft, accent: '#A85B00' },
          ][index % 4];
          return (
            <Pressable
              key={expense.id}
              accessibilityRole={canEdit ? 'button' : undefined}
              disabled={deletingId !== null || !canEdit}
              onPress={() => router.push(`/trip/${tripId}/expenses/${expense.id}` as never)}
            >
              <Card style={{ backgroundColor: palette.background, boxShadow: 'none' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="receipt-text-outline"
                      size={23}
                      color={palette.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{expense.title}</AppText>
                    <AppText variant="caption" style={{ color: palette.accent, fontWeight: '800' }}>
                      {formatDateOnly(expense.expenseDate, i18n.language)} ·{' '}
                      {t('expenses.paidBy', { name: payer?.displayName ?? '—' })}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <MoneyText
                      amountMinor={expense.amountMinor}
                      currency={expense.currency}
                      style={{ fontWeight: '800' }}
                    />
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      {t(`expenses.categories.${expense.category}`)}
                    </AppText>
                  </View>
                  {canEdit ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}
                      hitSlop={8}
                      disabled={deletingId !== null}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirm(expense.id, expense.title);
                      }}
                      style={{
                        width: 44,
                        height: 44,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={21}
                        color={deletingId === expense.id ? colors.textMuted : colors.danger}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
