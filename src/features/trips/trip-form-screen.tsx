import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AppText, Button, DateField, Screen, TextField } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { getTripDataErrorKey } from '@/features/data/errors';
import { TripDataErrorScreen, TripDataLoadingScreen } from '@/features/data/trip-data-state';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import type { Trip } from '@/types/domain';
import { parseMoney } from '@/utils/money/money';
import { tripFormSchema, type TripFormValues } from './trip-form-schema';

const today = () => format(new Date(), 'yyyy-MM-dd');

const formValuesForTrip = (trip: Trip | undefined): TripFormValues => ({
  title: trip?.title ?? '',
  destination: trip?.destination ?? '',
  startDate: trip?.startDate ?? today(),
  endDate: trip?.endDate ?? today(),
  baseCurrency: trip?.baseCurrency ?? 'TRY',
  budget: trip?.budgetAmountMinor ? String(trip.budgetAmountMinor / 100).replace('.', ',') : '',
  coverEmoji: trip?.coverEmoji ?? '✈️',
});
export function TripFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const data = useTripData();
  const existing = data.trips.find((trip) => trip.id === tripId);
  const { createTrip, updateTrip } = data;
  const { colors } = useAppTheme();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: formValuesForTrip(existing),
  });
  const startDate = useWatch({ control, name: 'startDate' });
  useEffect(() => {
    if (existing) reset(formValuesForTrip(existing));
  }, [existing, reset]);
  const submit = handleSubmit(async (values) => {
    try {
      const baseCurrency = values.baseCurrency.toUpperCase();
      const input = {
        title: values.title.trim(),
        destination: values.destination.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        baseCurrency,
        budgetAmountMinor: values.budget ? parseMoney(values.budget, baseCurrency) : null,
        coverEmoji: values.coverEmoji,
      };
      if (existing) {
        await updateTrip(existing.id, input);
        router.back();
      } else {
        const id = await createTrip(input);
        router.replace({ pathname: '/trip/[tripId]', params: { tripId: id } });
      }
    } catch (error) {
      if (__DEV__)
        console.info(
          '[TripWise] Failed to save trip',
          error instanceof Error ? error.message : String(error),
        );
      setError('root', { message: t(getTripDataErrorKey(error)) });
    }
  });
  const message = (name: keyof TripFormValues) =>
    errors[name]
      ? name === 'endDate'
        ? t('trips.invalidDates')
        : name === 'baseCurrency'
          ? t('trips.invalidCurrency')
          : t('common.required')
      : undefined;
  if (tripId && data.isLoading) return <TripDataLoadingScreen />;
  if (tripId && data.error) return <TripDataErrorScreen onRetry={() => void data.refetch()} />;
  return (
    <Screen contentContainerStyle={{ gap: spacing.lg }}>
      <AppText variant="title">{existing ? t('trips.formEdit') : t('trips.formNew')}</AppText>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label={t('trips.name')}
            value={field.value}
            onChangeText={field.onChange}
            error={message('title')}
          />
        )}
      />
      <Controller
        control={control}
        name="destination"
        render={({ field }) => (
          <TextField
            label={t('trips.destination')}
            value={field.value}
            onChangeText={field.onChange}
            error={message('destination')}
          />
        )}
      />
      <Controller
        control={control}
        name="startDate"
        render={({ field }) => (
          <DateField
            label={t('trips.startDate')}
            value={field.value}
            onChangeText={field.onChange}
            error={message('startDate')}
          />
        )}
      />
      <Controller
        control={control}
        name="endDate"
        render={({ field }) => (
          <DateField
            label={t('trips.endDate')}
            value={field.value}
            onChangeText={field.onChange}
            minimumDate={
              /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? new Date(`${startDate}T12:00:00`) : undefined
            }
            error={message('endDate')}
          />
        )}
      />
      <Controller
        control={control}
        name="baseCurrency"
        render={({ field }) => (
          <TextField
            label={t('trips.currency')}
            value={field.value}
            onChangeText={field.onChange}
            autoCapitalize="characters"
            maxLength={3}
            error={message('baseCurrency')}
          />
        )}
      />
      <Controller
        control={control}
        name="budget"
        render={({ field }) => (
          <TextField
            label={t('trips.budgetOptional')}
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="decimal-pad"
            error={message('budget')}
          />
        )}
      />
      <Controller
        control={control}
        name="coverEmoji"
        render={({ field }) => (
          <TextField
            label={t('trips.emoji')}
            value={field.value}
            onChangeText={field.onChange}
            error={message('coverEmoji')}
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
