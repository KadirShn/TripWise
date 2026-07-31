import { zodResolver } from '@hookform/resolvers/zod';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { z } from 'zod';
import {
  AppText,
  Button,
  Card,
  DateTimeField,
  EmptyState,
  MoneyText,
  Screen,
  TextField,
} from '@/components/ui';
import { DEMO_USER_ID } from '@/constants/demo-data';
import { useTripData } from '@/features/data/use-trip-data';
import type { ItineraryItem } from '@/types/domain';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { parseMoney } from '@/utils/money/money';

const validDateTime = (value: string) => !Number.isNaN(Date.parse(value));
const schema = z
  .object({
    title: z.string().trim().min(2),
    locationName: z.string(),
    startsAt: z.string().refine(validDateTime),
    endsAt: z.string(),
    notes: z.string(),
    estimatedCost: z.string(),
  })
  .superRefine((value, context) => {
    if (
      value.endsAt &&
      (!validDateTime(value.endsAt) || Date.parse(value.endsAt) < Date.parse(value.startsAt))
    )
      context.addIssue({ code: 'custom', path: ['endsAt'], message: 'invalidDate' });
  });
type FormValues = z.infer<typeof schema>;
const defaultStart = () => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
};
export function ItineraryScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const data = useTripData();
  const trip = data.trips.find((item) => item.id === tripId);
  const items = data.itineraryItems
    .filter((item) => item.tripId === tripId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const { addItineraryItem: add, updateItineraryItem: update, deleteItineraryItem: remove } = data;
  const [editing, setEditing] = useState<ItineraryItem | 'new' | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      locationName: '',
      startsAt: defaultStart(),
      endsAt: '',
      notes: '',
      estimatedCost: '',
    },
  });
  const selectedStart = useWatch({ control, name: 'startsAt' });
  const open = (item: ItineraryItem | 'new') => {
    setEditing(item);
    reset(
      item === 'new'
        ? {
            title: '',
            locationName: '',
            startsAt: defaultStart(),
            endsAt: '',
            notes: '',
            estimatedCost: '',
          }
        : {
            title: item.title,
            locationName: item.locationName ?? '',
            startsAt: item.startsAt,
            endsAt: item.endsAt ?? '',
            notes: item.notes ?? '',
            estimatedCost: item.estimatedCostMinor
              ? String(item.estimatedCostMinor / 100).replace('.', ',')
              : '',
          },
    );
  };
  const submit = handleSubmit(async (values) => {
    if (!trip) return;
    const cost = values.estimatedCost ? parseMoney(values.estimatedCost, trip.baseCurrency) : null;
    if (values.estimatedCost && (!cost || cost < 0)) {
      setError('estimatedCost', { message: t('expenses.invalidAmount') });
      return;
    }
    const input = {
      tripId,
      createdBy: editing !== 'new' && editing ? editing.createdBy : DEMO_USER_ID,
      title: values.title.trim(),
      notes: values.notes.trim() || null,
      locationName: values.locationName.trim() || null,
      startsAt: values.startsAt,
      endsAt: values.endsAt || null,
      estimatedCostMinor: cost,
      sortOrder:
        editing !== 'new' && editing
          ? editing.sortOrder
          : items.filter(
              (item) =>
                format(new Date(item.startsAt), 'yyyy-MM-dd') ===
                format(new Date(values.startsAt), 'yyyy-MM-dd'),
            ).length,
    };
    try {
      if (editing !== 'new' && editing) await update(editing.id, input);
      else await add(input);
      setEditing(null);
    } catch {
      setError('root', { message: t('auth.genericError') });
    }
  });
  const groups = useMemo(
    () =>
      items.reduce<Record<string, ItineraryItem[]>>((result, item) => {
        const key = format(new Date(item.startsAt), 'yyyy-MM-dd');
        (result[key] ??= []).push(item);
        return result;
      }, {}),
    [items],
  );
  const confirmDelete = (item: ItineraryItem) =>
    Alert.alert(t('common.delete'), item.title, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void remove(item.id).catch(() => Alert.alert(t('common.error'), t('auth.genericError')));
        },
      },
    ]);
  return (
    <Screen>
      <Button
        label={t('itinerary.add')}
        icon="map-marker-plus-outline"
        onPress={() => open('new')}
      />
      {editing ? (
        <Card>
          <AppText variant="subtitle">
            {editing === 'new' ? t('itinerary.add') : t('itinerary.edit')}
          </AppText>
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <TextField
                label={t('itinerary.itemTitle')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.title ? t('common.required') : undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="locationName"
            render={({ field }) => (
              <TextField
                label={t('itinerary.location')}
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="startsAt"
            render={({ field }) => (
              <DateTimeField
                label={t('itinerary.startsAt')}
                value={field.value}
                onChangeText={field.onChange}
                error={errors.startsAt ? t('itinerary.invalidDate') : undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="endsAt"
            render={({ field }) => (
              <DateTimeField
                label={t('itinerary.endsAt')}
                value={field.value}
                onChangeText={field.onChange}
                minimumDate={validDateTime(selectedStart) ? new Date(selectedStart) : undefined}
                optional
                error={errors.endsAt ? t('itinerary.invalidDate') : undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="estimatedCost"
            render={({ field }) => (
              <TextField
                label={t('itinerary.estimatedCost')}
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="decimal-pad"
                error={errors.estimatedCost?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextField
                label={t('itinerary.notes')}
                value={field.value}
                onChangeText={field.onChange}
                multiline
              />
            )}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              style={{ flex: 1 }}
              variant="ghost"
              label={t('common.cancel')}
              onPress={() => setEditing(null)}
            />
            <Button
              style={{ flex: 1 }}
              label={t('common.save')}
              loading={isSubmitting}
              onPress={() => void submit()}
            />
          </View>
        </Card>
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          title={t('itinerary.emptyTitle')}
          description={t('itinerary.emptyDescription')}
          actionLabel={t('itinerary.add')}
          onAction={() => open('new')}
        />
      ) : (
        Object.entries(groups).map(([date, dayItems]) => (
          <View key={date} style={{ gap: spacing.md }}>
            <AppText variant="title">
              {t('itinerary.dayTitle', {
                date: format(new Date(`${date}T12:00:00`), 'dd.MM.yyyy'),
              })}
            </AppText>
            {dayItems.map((item) => (
              <Pressable key={item.id} onPress={() => open(item)}>
                <Card>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={{ alignItems: 'center' }}>
                      <AppText variant="label" style={{ color: colors.primary }}>
                        {format(new Date(item.startsAt), 'HH:mm')}
                      </AppText>
                      <View
                        style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: colors.border }}
                      />
                    </View>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <AppText variant="subtitle">{item.title}</AppText>
                      {item.locationName ? (
                        <AppText style={{ color: colors.textMuted }}>{item.locationName}</AppText>
                      ) : null}
                      {item.estimatedCostMinor !== null && trip ? (
                        <MoneyText
                          amountMinor={item.estimatedCostMinor}
                          currency={trip.baseCurrency}
                          style={{ color: colors.primary, fontWeight: '700' }}
                        />
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityLabel={t('common.delete')}
                      hitSlop={8}
                      onPress={() => confirmDelete(item)}
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
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}
