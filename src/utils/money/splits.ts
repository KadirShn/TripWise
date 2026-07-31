import type { Id } from '@/types/domain';

export interface SplitShare {
  memberId: Id;
  shareMinor: number;
  percentageBasisPoints: number | null;
}

function assertMembers(memberIds: Id[]): void {
  if (memberIds.length === 0) throw new Error('At least one member is required');
  if (new Set(memberIds).size !== memberIds.length) throw new Error('Member ids must be unique');
}

export function splitEqually(amountMinor: number, memberIds: Id[]): SplitShare[] {
  assertMembers(memberIds);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Amount must be a positive integer');
  }
  const base = Math.floor(amountMinor / memberIds.length);
  const remainder = amountMinor % memberIds.length;
  return memberIds.map((memberId, index) => ({
    memberId,
    shareMinor: base + (index < remainder ? 1 : 0),
    percentageBasisPoints: null,
  }));
}

export function validateExactSplit(
  amountMinor: number,
  shares: { memberId: Id; shareMinor: number }[],
): SplitShare[] {
  assertMembers(shares.map((share) => share.memberId));
  if (shares.some((share) => !Number.isSafeInteger(share.shareMinor) || share.shareMinor < 0)) {
    throw new Error('Exact shares must be non-negative integers');
  }
  if (shares.reduce((total, share) => total + share.shareMinor, 0) !== amountMinor) {
    throw new Error('Exact shares must equal the expense amount');
  }
  return shares.map((share) => ({ ...share, percentageBasisPoints: null }));
}

export function splitByPercentage(
  amountMinor: number,
  percentages: { memberId: Id; basisPoints: number }[],
): SplitShare[] {
  assertMembers(percentages.map((share) => share.memberId));
  if (
    percentages.some(
      (share) => !Number.isSafeInteger(share.basisPoints) || share.basisPoints < 0,
    ) ||
    percentages.reduce((total, share) => total + share.basisPoints, 0) !== 10_000
  ) {
    throw new Error('Percentages must total 100');
  }
  const provisional = percentages.map((share, index) => {
    const numerator = BigInt(amountMinor) * BigInt(share.basisPoints);
    return {
      ...share,
      index,
      shareMinor: Number(numerator / 10_000n),
      remainder: numerator % 10_000n,
    };
  });
  const remainder = amountMinor - provisional.reduce((sum, share) => sum + share.shareMinor, 0);
  const order = [...provisional].sort(
    (a, b) => Number(b.remainder - a.remainder) || a.index - b.index,
  );
  for (let index = 0; index < remainder; index += 1) order[index].shareMinor += 1;
  return provisional.map((share) => ({
    memberId: share.memberId,
    shareMinor: share.shareMinor,
    percentageBasisPoints: share.basisPoints,
  }));
}
