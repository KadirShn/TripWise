import { fetchExchangeRate, parseFrankfurterResponse } from './exchange-rates';

const response = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as Response;

describe('exchange rates', () => {
  it('converts a reference rate to integer millionths', () => {
    expect(
      parseFrankfurterResponse({ date: '2026-10-23', rates: { TRY: 55.6715 } }, 'TRY'),
    ).toEqual({ status: 'ok', rateMillionths: 55_671_500, date: '2026-10-23' });
  });

  it('reports unsupported and malformed responses', () => {
    expect(parseFrankfurterResponse({ date: '2026-10-23', rates: {} }, 'TRY')).toEqual({
      status: 'unsupported',
    });
    expect(parseFrankfurterResponse('oops', 'TRY')).toEqual({ status: 'failed' });
  });

  it('requests the base and target currency and handles HTTP failures', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(response(200, { date: '2026-10-23', rates: { TRY: 48.25 } }));
    await expect(fetchExchangeRate('USD', 'TRY', fetcher)).resolves.toEqual({
      status: 'ok',
      rateMillionths: 48_250_000,
      date: '2026-10-23',
    });
    expect(fetcher.mock.calls[0][0]).toContain('base=USD&symbols=TRY');

    await expect(
      fetchExchangeRate('XYZ', 'TRY', jest.fn().mockResolvedValue(response(404, {}))),
    ).resolves.toEqual({ status: 'unsupported' });
    await expect(
      fetchExchangeRate('USD', 'TRY', jest.fn().mockRejectedValue(new Error('offline'))),
    ).resolves.toEqual({ status: 'failed' });
  });

  it('does not call the network for the same currency', async () => {
    const fetcher = jest.fn();
    await expect(fetchExchangeRate('TRY', 'TRY', fetcher)).resolves.toMatchObject({
      rateMillionths: 1_000_000,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
