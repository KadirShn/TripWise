import type { CurrencyCode } from '@/types/domain';

const DEFAULT_FRACTION_DIGITS = 2;

export function getCurrencyFractionDigits(currency: CurrencyCode, locale = 'tr-TR'): number {
  try {
    return (
      new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? DEFAULT_FRACTION_DIGITS
    );
  } catch {
    return DEFAULT_FRACTION_DIGITS;
  }
}

export function formatMoney(amountMinor: number, currency: CurrencyCode, locale = 'tr-TR'): string {
  const digits = getCurrencyFractionDigits(currency, locale);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amountMinor / 10 ** digits);
}

/** Formats minor units as an editable decimal string, e.g. 12345 TRY -> "123,45". */
export function formatMinorForInput(
  amountMinor: number,
  currency: CurrencyCode,
  locale = 'tr-TR',
): string {
  const digits = getCurrencyFractionDigits(currency, locale);
  const decimal =
    new Intl.NumberFormat(locale).formatToParts(1.5).find((part) => part.type === 'decimal')
      ?.value ?? ',';
  return (amountMinor / 10 ** digits).toFixed(digits).replace('.', decimal);
}

export function parseMoney(input: string, currency: CurrencyCode, locale = 'tr-TR'): number | null {
  const digits = getCurrencyFractionDigits(currency, locale);
  const trimmed = input.trim();
  if (!trimmed) return null;
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? ',';
  const group = parts.find((part) => part.type === 'group')?.value ?? '.';
  const normalized = trimmed
    .replace(new RegExp(`\\${group}`, 'g'), '')
    .replace(decimal, '.')
    .replace(/\s/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const negative = normalized.startsWith('-');
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ''] = unsigned.split('.');
  if (fraction.length > digits) return null;
  const minorText = `${whole}${fraction.padEnd(digits, '0')}`.replace(/^0+(?=\d)/, '');
  const result = Number(minorText || '0') * (negative ? -1 : 1);
  return Number.isSafeInteger(result) ? result : null;
}

export function parsePercentageToBasisPoints(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(value) && value >= 0 && value <= 10_000 ? value : null;
}
