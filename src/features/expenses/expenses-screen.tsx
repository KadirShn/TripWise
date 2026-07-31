import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { AppText, Button, Card, EmptyState, MoneyText, Screen } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function ExpensesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const data = useTripData();
  const expenses = data.expenses
    .filter((expense) => expense.tripId === tripId)
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  const members = data.members.filter((member) => member.tripId === tripId);
  const remove = data.deleteExpense;
  const confirm = (id: string, title: string) =>
    Alert.alert(t('common.delete'), title, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void remove(id).catch(() => Alert.alert(t('common.error'), t('auth.genericError')));
        },
      },
    ]);
  return (
    <Screen>
      <Button
        label={t('expenses.add')}
        icon="plus"
        onPress={() => router.push(`/trip/${tripId}/expenses/new` as never)}
      />
      {expenses.length === 0 ? (
        <EmptyState
          title={t('expenses.emptyTitle')}
          description={t('expenses.emptyDescription')}
          actionLabel={t('expenses.add')}
          onAction={() => router.push(`/trip/${tripId}/expenses/new` as never)}
        />
      ) : (
        expenses.map((expense) => {
          const payer = members.find((m) => m.id === expense.paidByMemberId);
          return (
            <Pressable
              key={expense.id}
              onPress={() => router.push(`/trip/${tripId}/expenses/${expense.id}` as never)}
            >
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons
                      name="receipt-text-outline"
                      size={23}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="label">{expense.title}</AppText>
                    <AppText variant="caption" style={{ color: colors.textMuted }}>
                      {expense.expenseDate} ·{' '}
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
                  <Pressable
                    accessibilityLabel={t('common.delete')}
                    hitSlop={8}
                    onPress={() => confirm(expense.id, expense.title)}
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
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
