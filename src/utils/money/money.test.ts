import { formatMinorForInput, formatMoney, getCurrencyFractionDigits, parseMoney } from './money';

describe('money helpers', () => {
  it('parses Turkish decimal input into minor units', () => {
    expect(parseMoney('1.234,56', 'TRY')).toBe(123456);
  });
  it('formats currency using the requested locale', () => {
    expect(formatMoney(123456, 'TRY', 'tr-TR')).toContain('1.234,56');
  });
  it('supports zero-decimal currencies through Intl metadata', () => {
    expect(getCurrencyFractionDigits('JPY')).toBe(0);
    expect(parseMoney('1500', 'JPY')).toBe(1500);
  });
  it('rejects unsafe or over-precise values', () => {
    expect(parseMoney('1,001', 'TRY')).toBeNull();
    expect(parseMoney('abc', 'TRY')).toBeNull();
  });
  it('formats minor units for editable inputs and round-trips through parsing', () => {
    expect(formatMinorForInput(12345, 'TRY')).toBe('123,45');
    expect(formatMinorForInput(1500, 'JPY')).toBe('1500');
    expect(parseMoney(formatMinorForInput(987654, 'EUR'), 'EUR')).toBe(987654);
  });
});
