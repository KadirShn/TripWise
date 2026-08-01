import { tripFormSchema } from './trip-form-schema';

const valid = {
  title: 'Kapadokya',
  destination: 'Nevşehir',
  startDate: '2026-08-01',
  endDate: '2026-08-03',
  baseCurrency: 'TRY',
  budget: '1500,00',
  coverEmoji: '✈️',
};

describe('trip form validation', () => {
  it('accepts a valid localized-money trip', () => {
    expect(tripFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects reversed or impossible dates', () => {
    expect(
      tripFormSchema.safeParse({ ...valid, startDate: '2026-08-04', endDate: '2026-08-03' })
        .success,
    ).toBe(false);
    expect(tripFormSchema.safeParse({ ...valid, startDate: '2026-02-31' }).success).toBe(false);
  });

  it('rejects non-positive budgets and malformed currencies', () => {
    expect(tripFormSchema.safeParse({ ...valid, budget: '0' }).success).toBe(false);
    expect(tripFormSchema.safeParse({ ...valid, baseCurrency: 'TL' }).success).toBe(false);
  });
});
