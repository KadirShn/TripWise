import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AppText, Button, DateField, Screen, TextField } from '@/components/ui';
import { useTripData } from '@/features/data/use-trip-data';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
import { parseMoney } from '@/utils/money/money';
import { isValidDateRange } from '@/utils/validation/dates';

const schema = z
  .object({
    title: z.string().trim().min(2),
    destination: z.string().trim().min(2),
    startDate: z.string(),
    endDate: z.string(),
    baseCurrency: z.string().regex(/^[A-Za-z]{3}$/),
    budget: z.string(),
    coverEmoji: z.string().min(1).max(8),
  })
  .superRefine((value, context) => {
    if (!isValidDateRange(value.startDate, value.endDate))
      context.addIssue({ code: 'custom', path: ['endDate'], message: 'invalidDates' });
    if (value.budget && (parseMoney(value.budget, value.baseCurrency.toUpperCase()) ?? 0) <= 0)
      context.addIssue({ code: 'custom', path: ['budget'], message: 'invalidBudget' });
  });
type FormValues = z.infer<typeof schema>;
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: existing?.title ?? '',
      destination: existing?.destination ?? '',
      startDate: existing?.startDate ?? new Date().toISOString().slice(0, 10),
      endDate: existing?.endDate ?? new Date().toISOString().slice(0, 10),
      baseCurrency: existing?.baseCurrency ?? 'TRY',
      budget: existing?.budgetAmountMinor
        ? String(existing.budgetAmountMinor / 100).replace('.', ',')
        : '',
      coverEmoji: existing?.coverEmoji ?? '✈️',
    },
  });
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
      setError('root', { message: t('auth.genericError') });
    }
  });
  const message = (name: keyof FormValues) =>
    errors[name]
      ? name === 'endDate'
        ? t('trips.invalidDates')
        : name === 'baseCurrency'
          ? t('trips.invalidCurrency')
          : t('common.required')
      : undefined;
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
