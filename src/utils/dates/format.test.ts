import { calendarDateKey, formatDateOnly } from './format';

describe('localized date helpers', () => {
  it('formats Turkish and English calendar dates', () => {
    expect(formatDateOnly('2026-08-01', 'tr')).toContain('1 Ağustos 2026');
    expect(formatDateOnly('2026-08-01', 'en')).toContain('August 1, 2026');
  });

  it('groups a near-midnight instant in the requested timezone', () => {
    const instant = '2026-07-31T21:30:00.000Z';
    expect(calendarDateKey(instant, 'Europe/Istanbul')).toBe('2026-08-01');
    expect(calendarDateKey(instant, 'UTC')).toBe('2026-07-31');
  });
});
