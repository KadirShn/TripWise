import type { Expense, Settlement } from '@/types/domain';
import { calculateBalances, simplifySettlements } from './balances';

const expense: Expense = {
  id: 'e1',
  tripId: 't1',
  createdBy: 'u1',
  paidByMemberId: 'a',
  title: 'Akşam yemeği',
  notes: null,
  category: 'food',
  amountMinor: 10000,
  currency: 'EUR',
  exchangeRateMillionths: 35_000_000,
  expenseDate: '2026-07-01',
  splitMethod: 'equal',
  splits: [
    { id: 's1', expenseId: 'e1', memberId: 'a', shareMinor: 3334, percentageBasisPoints: null },
    { id: 's2', expenseId: 'e1', memberId: 'b', shareMinor: 3333, percentageBasisPoints: null },
    { id: 's3', expenseId: 'e1', memberId: 'c', shareMinor: 3333, percentageBasisPoints: null },
  ],
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

describe('balances and settlements', () => {
  it('calculates balances after integer exchange-rate conversion', () => {
    const balances = calculateBalances(['a', 'b', 'c', 'd'], [expense]);
    expect(balances.reduce((sum, balance) => sum + balance.balanceMinor, 0)).toBe(0);
    expect(balances.find((balance) => balance.memberId === 'a')?.balanceMinor).toBe(233310);
    expect(balances.find((balance) => balance.memberId === 'd')?.balanceMinor).toBe(0);
  });
  it('simplifies debts deterministically', () => {
    expect(
      simplifySettlements([
        { memberId: 'a', balanceMinor: 700 },
        { memberId: 'b', balanceMinor: 300 },
        { memberId: 'c', balanceMinor: -600 },
        { memberId: 'd', balanceMinor: -400 },
      ]),
    ).toEqual([
      { fromMemberId: 'c', toMemberId: 'a', amountMinor: 600 },
      { fromMemberId: 'd', toMemberId: 'b', amountMinor: 300 },
      { fromMemberId: 'd', toMemberId: 'a', amountMinor: 100 },
    ]);
  });
  it('applies paid settlements and ignores planned ones', () => {
    const paid: Settlement = {
      id: 'p1',
      tripId: 't1',
      fromMemberId: 'b',
      toMemberId: 'a',
      amountMinor: 116655,
      currency: 'TRY',
      status: 'paid',
      paidAt: '2026-07-02T00:00:00Z',
      createdAt: '2026-07-02T00:00:00Z',
    };
    const planned: Settlement = { ...paid, id: 'p2', fromMemberId: 'c', status: 'planned' };
    const balances = calculateBalances(['a', 'b', 'c'], [expense], [paid, planned]);
    expect(balances.reduce((sum, balance) => sum + balance.balanceMinor, 0)).toBe(0);
    expect(balances.find((balance) => balance.memberId === 'b')?.balanceMinor).toBe(0);
    expect(simplifySettlements(balances)).toEqual([
      { fromMemberId: 'c', toMemberId: 'a', amountMinor: 116655 },
    ]);
  });
  it('returns an empty plan once every transfer is paid', () => {
    const initial = calculateBalances(['a', 'b', 'c'], [expense]);
    const paid: Settlement[] = simplifySettlements(initial).map((transfer, index) => ({
      id: `p${index}`,
      tripId: 't1',
      ...transfer,
      currency: 'TRY',
      status: 'paid',
      paidAt: '2026-07-02T00:00:00Z',
      createdAt: '2026-07-02T00:00:00Z',
    }));
    const settled = calculateBalances(['a', 'b', 'c'], [expense], paid);
    expect(settled.every((balance) => balance.balanceMinor === 0)).toBe(true);
    expect(simplifySettlements(settled)).toEqual([]);
  });
});
