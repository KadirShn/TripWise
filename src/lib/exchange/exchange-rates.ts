/**
 * Reference rates from the European Central Bank via the keyless Frankfurter API.
 * Rates are a convenience prefill only: the user can always edit the value, and the
 * expense keeps the rate it was saved with.
 */
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest';
const TIMEOUT_MS = 8_000;

export type ExchangeRateResult =
  | { status: 'ok'; rateMillionths: number; date: string }
  | { status: 'unsupported' }
  | { status: 'failed' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseFrankfurterResponse(body: unknown, target: string): ExchangeRateResult {
  if (!isRecord(body) || !isRecord(body.rates) || typeof body.date !== 'string')
    return { status: 'failed' };
  const rate = body.rates[target];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0)
    return { status: 'unsupported' };
  const rateMillionths = Math.round(rate * 1_000_000);
  return rateMillionths > 0
    ? { status: 'ok', rateMillionths, date: body.date }
    : { status: 'failed' };
}

export async function fetchExchangeRate(
  from: string,
  to: string,
  fetcher: typeof fetch = fetch,
): Promise<ExchangeRateResult> {
  if (from === to) return { status: 'ok', rateMillionths: 1_000_000, date: '' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetcher(
      `${FRANKFURTER_URL}?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`,
      { signal: controller.signal },
    );
    // Frankfurter answers 404/422 for currencies the ECB does not publish.
    if (response.status === 404 || response.status === 422) return { status: 'unsupported' };
    if (!response.ok) return { status: 'failed' };
    return parseFrankfurterResponse(await response.json(), to);
  } catch {
    return { status: 'failed' };
  } finally {
    clearTimeout(timer);
  }
}
