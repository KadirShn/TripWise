import { splitByPercentage, splitEqually, validateExactSplit } from './splits';

describe('expense splits', () => {
  it('allocates equal-split remainders deterministically', () => {
    expect(splitEqually(100, ['a', 'b', 'c']).map((share) => share.shareMinor)).toEqual([
      34, 33, 33,
    ]);
  });
  it('allocates percentage rounding without losing a minor unit', () => {
    const shares = splitByPercentage(101, [
      { memberId: 'a', basisPoints: 3334 },
      { memberId: 'b', basisPoints: 3333 },
      { memberId: 'c', basisPoints: 3333 },
    ]);
    expect(shares.map((share) => share.shareMinor)).toEqual([34, 34, 33]);
    expect(shares.reduce((sum, share) => sum + share.shareMinor, 0)).toBe(101);
  });
  it('requires exact shares to match the expense', () => {
    expect(() =>
      validateExactSplit(100, [
        { memberId: 'a', shareMinor: 20 },
        { memberId: 'b', shareMinor: 79 },
      ]),
    ).toThrow();
  });
});
