import { isValidDateRange } from './dates';

describe('date validation', () => {
  it('accepts an ordered ISO date range', () => {
    expect(isValidDateRange('2026-07-01', '2026-07-08')).toBe(true);
  });
  it('rejects reversed and malformed ranges', () => {
    expect(isValidDateRange('2026-07-08', '2026-07-01')).toBe(false);
    expect(isValidDateRange('01.07.2026', '08.07.2026')).toBe(false);
    expect(isValidDateRange('2026-02-31', '2026-03-02')).toBe(false);
  });
});
