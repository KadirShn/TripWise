import type { Expense, Id, MemberBalance, SettlementTransfer } from '@/types/domain';

const RATE_SCALE = 1_000_000n;

function convertedShares(expense: Expense): { memberId: Id; amountMinor: number }[] {
  const convertedTotal = Number(
    (BigInt(expense.amountMinor) * BigInt(expense.exchangeRateMillionths) + RATE_SCALE / 2n) /
      RATE_SCALE,
  );
  const values = expense.splits.map((split, index) => {
    const numerator = BigInt(split.shareMinor) * BigInt(expense.exchangeRateMillionths);
    return { memberId: split.memberId, index, amountMinor: Number(numerator / RATE_SCALE) };
  });
  let remainder = convertedTotal - values.reduce((sum, value) => sum + value.amountMinor, 0);
  for (let index = 0; index < values.length && remainder > 0; index += 1, remainder -= 1) {
    values[index].amountMinor += 1;
  }
  return values;
}

export function calculateBalances(memberIds: Id[], expenses: Expense[]): MemberBalance[] {
  const balances = new Map(memberIds.map((memberId) => [memberId, 0]));
  for (const expense of expenses) {
    const converted = convertedShares(expense);
    const total = converted.reduce((sum, share) => sum + share.amountMinor, 0);
    balances.set(expense.paidByMemberId, (balances.get(expense.paidByMemberId) ?? 0) + total);
    for (const share of converted) {
      balances.set(share.memberId, (balances.get(share.memberId) ?? 0) - share.amountMinor);
    }
  }
  return [...balances.entries()].map(([memberId, balanceMinor]) => ({ memberId, balanceMinor }));
}

export function simplifySettlements(balances: MemberBalance[]): SettlementTransfer[] {
  const total = balances.reduce((sum, balance) => sum + balance.balanceMinor, 0);
  if (total !== 0) throw new Error('Balances must sum to zero');
  const creditors = balances
    .filter((balance) => balance.balanceMinor > 1)
    .map((balance) => ({ memberId: balance.memberId, amount: balance.balanceMinor }));
  const debtors = balances
    .filter((balance) => balance.balanceMinor < -1)
    .map((balance) => ({ memberId: balance.memberId, amount: -balance.balanceMinor }));
  const transfers: SettlementTransfer[] = [];
  const sortLargest = (values: { memberId: Id; amount: number }[]) =>
    values.sort((a, b) => b.amount - a.amount || a.memberId.localeCompare(b.memberId));

  while (creditors.length > 0 && debtors.length > 0) {
    sortLargest(creditors);
    sortLargest(debtors);
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amountMinor = Math.min(creditor.amount, debtor.amount);
    transfers.push({ fromMemberId: debtor.memberId, toMemberId: creditor.memberId, amountMinor });
    creditor.amount -= amountMinor;
    debtor.amount -= amountMinor;
    if (creditor.amount <= 1) creditors.shift();
    if (debtor.amount <= 1) debtors.shift();
  }
  return transfers;
}
