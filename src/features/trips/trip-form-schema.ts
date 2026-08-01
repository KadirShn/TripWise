import { z } from 'zod';
import { parseMoney } from '@/utils/money/money';
import { isValidDateRange } from '@/utils/validation/dates';

export const tripFormSchema = z
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

export type TripFormValues = z.infer<typeof tripFormSchema>;
