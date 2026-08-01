import { zodResolver } from '@hookform/resolvers/zod';
import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import { AppText, Button, DateField, Screen, SelectField, TextField } from '@/components/ui';
import { DEMO_USER_ID } from '@/constants/demo-data';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { useTripData } from '@/features/data/use-trip-data';
import type { ExpenseCategory, SplitMethod } from '@/types/domain';
import { useAppTheme } from '@/theme/use-app-theme';
import {
  getCurrencyFractionDigits,
  parseMoney,
  parsePercentageToBasisPoints,
} from '@/utils/money/money';
import { splitByPercentage, splitEqually, validateExactSplit } from '@/utils/money/splits';
import { ExpenseSplitFields } from './expense-split-fields';

const schema = z.object({
  title: z.string().trim().min(2),
  amount: z.string().min(1),
  currency: z.string().regex(/^[A-Za-z]{3}$/),
  exchangeRate: z.string().min(1),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string(),
  category: z.enum(['accommodation', 'transport', 'food', 'activity', 'shopping', 'other']),
  paidByMemberId: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;
const categories: ExpenseCategory[] = [
  'accommodation',
  'transport',
  'food',
  'activity',
  'shopping',
  'other',
];
const minorInput = (value: number, currency: string) =>
  (value / 10 ** getCurrencyFractionDigits(currency))
    .toFixed(getCurrencyFractionDigits(currency))
    .replace('.', ',');
const parseRate = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const result = Number(whole) * 1_000_000 + Number(fraction.padEnd(6, '0'));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
};

export function ExpenseFormScreen() {
  const { tripId, expenseId } = useLocalSearchParams<{ tripId: string; expenseId?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useAppTheme();
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const members = data.members.filter((item) => item.tripId === tripId);
  const existing = data.expenses.find((item) => item.id === expenseId);
  const save = data.upsertExpense;
  const [method, setMethod] = useState<SplitMethod>(existing?.splitMethod ?? 'equal');
  const [selected, setSelected] = useState<string[]>(
    existing?.splits.map((split) => split.memberId) ?? members.map((member) => member.id),
  );
  const [exactValues, setExactValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      existing?.splits.map((split) => [
        split.memberId,
        minorInput(split.shareMinor, existing.currency),
      ]) ?? [],
    ),
  );
  const [percentValues, setPercentValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      existing?.splits.map((split) => [
        split.memberId,
        split.percentageBasisPoints === null
          ? ''
          : String(split.percentageBasisPoints / 100).replace('.', ','),
      ]) ?? [],
    ),
  );
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: existing?.title ?? '',
      amount: existing ? minorInput(existing.amountMinor, existing.currency) : '',
      currency: existing?.currency ?? trip?.baseCurrency ?? 'TRY',
      exchangeRate: existing
        ? String(existing.exchangeRateMillionths / 1_000_000).replace('.', ',')
        : '1',
      expenseDate: existing?.expenseDate ?? new Date().toISOString().slice(0, 10),
      notes: existing?.notes ?? '',
      category: existing?.category ?? 'food',
      paidByMemberId: existing?.paidByMemberId ?? members[0]?.id ?? '',
    },
  });
  const currency = useWatch({ control, name: 'currency' }).toUpperCase();
  const participantOptions = useMemo(
    () => members.map((member) => ({ value: member.id, label: member.displayName })),
    [members],
  );
  const toggle = (memberId: string) =>
    setSelected((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  const submit = handleSubmit(async (values) => {
    const amountMinor = parseMoney(values.amount, currency);
    if (!amountMinor || amountMinor <= 0) {
      setError('amount', { message: t('expenses.invalidAmount') });
      return;
    }
    if (selected.length === 0) {
      setError('root', { message: t('expenses.selectParticipant') });
      return;
    }
    let calculated;
    try {
      if (method === 'equal') calculated = splitEqually(amountMinor, selected);
      else if (method === 'exact')
        calculated = validateExactSplit(
          amountMinor,
          selected.map((memberId) => ({
            memberId,
            shareMinor: parseMoney(exactValues[memberId] ?? '', currency) ?? -1,
          })),
        );
      else
        calculated = splitByPercentage(
          amountMinor,
          selected.map((memberId) => ({
            memberId,
            basisPoints: parsePercentageToBasisPoints(percentValues[memberId] ?? '') ?? -1,
          })),
        );
    } catch {
      setError('root', {
        message:
          method === 'percentage' ? t('expenses.percentageMismatch') : t('expenses.totalMismatch'),
      });
      return;
    }
    const exchangeRateMillionths =
      currency === trip?.baseCurrency ? 1_000_000 : parseRate(values.exchangeRate);
    if (!exchangeRateMillionths) {
      setError('exchangeRate', { message: t('expenses.invalidAmount') });
      return;
    }
    const id = existing?.id ?? randomUUID();
    const timestamp = new Date().toISOString();
    try {
      await save({
        id,
        tripId,
        createdBy: existing?.createdBy ?? DEMO_USER_ID,
        paidByMemberId: values.paidByMemberId,
        title: values.title.trim(),
        notes: values.notes.trim() || null,
        category: values.category,
        amountMinor,
        currency,
        exchangeRateMillionths,
        expenseDate: values.expenseDate,
        splitMethod: method,
        splits: calculated.map((split) => ({
          id: existing?.splits.find((item) => item.memberId === split.memberId)?.id ?? randomUUID(),
          expenseId: id,
          ...split,
        })),
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });
      router.back();
    } catch (error) {
      setError('root', { message: t(getTripDataErrorKey(error)) });
    }
  });
  if (data.isLoading) return <TripDataLoadingScreen />;
  if (data.error) return <TripDataErrorScreen onRetry={() => void data.refetch()} />;
  if (!trip) return null;
  return (
    <Screen>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label={t('expenses.name')}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.title ? t('common.required') : undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <TextField
            label={t('expenses.amount')}
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="decimal-pad"
            error={errors.amount?.message ?? undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <TextField
            label={t('expenses.currency')}
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="characters"
            maxLength={3}
            error={errors.currency ? t('trips.invalidCurrency') : undefined}
          />
        )}
      />
      {currency !== trip.baseCurrency ? (
        <Controller
          control={control}
          name="exchangeRate"
          render={({ field }) => (
            <TextField
              label={t('expenses.exchangeRate')}
              hint={t('expenses.exchangeRateHint')}
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="decimal-pad"
              error={errors.exchangeRate?.message}
            />
          )}
        />
      ) : null}
      <Controller
        control={control}
        name="expenseDate"
        render={({ field }) => (
          <DateField
            label={t('expenses.date')}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.expenseDate ? t('itinerary.invalidDate') : undefined}
          />
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <SelectField
            label={t('expenses.category')}
            value={field.value}
            onChange={field.onChange}
            options={categories.map((value) => ({
              value,
              label: t(`expenses.categories.${value}`),
            }))}
          />
        )}
      />
      <Controller
        control={control}
        name="paidByMemberId"
        render={({ field }) => (
          <SelectField
            label={t('expenses.payer')}
            value={field.value}
            onChange={field.onChange}
            options={participantOptions}
            error={errors.paidByMemberId ? t('common.required') : undefined}
          />
        )}
      />
      <SelectField
        label={t('expenses.splitMethod')}
        value={method}
        onChange={setMethod}
        options={[
          { value: 'equal', label: t('expenses.equal') },
          { value: 'exact', label: t('expenses.exact') },
          { value: 'percentage', label: t('expenses.percentage') },
        ]}
      />
      <ExpenseSplitFields
        members={members}
        method={method}
        selected={selected}
        exactValues={exactValues}
        percentValues={percentValues}
        onToggle={toggle}
        onExactChange={(memberId, value) =>
          setExactValues((current) => ({ ...current, [memberId]: value }))
        }
        onPercentChange={(memberId, value) =>
          setPercentValues((current) => ({ ...current, [memberId]: value }))
        }
      />
      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <TextField
            label={t('expenses.notes')}
            value={field.value}
            onChangeText={field.onChange}
            multiline
          />
        )}
      />
      {errors.root?.message ? (
        <AppText style={{ color: colors.danger }}>{errors.root.message}</AppText>
      ) : null}
      <Button label={t('common.save')} loading={isSubmitting} onPress={() => void submit()} />
    </Screen>
  );
}
