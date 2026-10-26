import { isValidInviteCode, normalizeInviteCode } from '@/constants/app-links';
import { getTripDataErrorKey, TripDataError } from '@/features/data/errors';
import { buildSettlementShareText } from '@/features/balances/settlement-share';
import { parseInvitePreview } from '@/lib/supabase/trip-repository';
import { i18n } from '@/lib/i18n';
import { demoMembers, demoTrips } from '@/constants/demo-data';

jest.mock('@/lib/supabase/client', () => ({ supabase: null }));

describe('invite helpers', () => {
  it('normalizes and validates invite codes', () => {
    expect(normalizeInviteCode(' abcd-2345 ')).toBe('ABCD2345');
    expect(isValidInviteCode('abcd-2345')).toBe(true);
    // 0, 1, I and O are excluded to avoid reading mistakes.
    expect(isValidInviteCode('ABCD1234')).toBe(false);
    expect(isValidInviteCode('ABC')).toBe(false);
  });

  it('parses the invite preview RPC payload defensively', () => {
    expect(
      parseInvitePreview({
        trip_id: 't1',
        trip_title: 'Kapadokya',
        destination: 'Nevşehir',
        cover_emoji: '🎈',
        role: 'viewer',
        already_member: false,
        unclaimed_members: [{ id: 'm1', display_name: 'Ayşe' }, 'bad'],
      }),
    ).toEqual({
      tripId: 't1',
      tripTitle: 'Kapadokya',
      destination: 'Nevşehir',
      coverEmoji: '🎈',
      role: 'viewer',
      alreadyMember: false,
      unclaimedMembers: [{ id: 'm1', displayName: 'Ayşe' }],
    });
    expect(() => parseInvitePreview(null)).toThrow('INVITE_NOT_FOUND');
  });

  it('maps server and client error codes to translation keys', () => {
    expect(getTripDataErrorKey(new Error('INVITE_NOT_FOUND'))).toBe('invites.errors.notFound');
    expect(getTripDataErrorKey(new TripDataError('ACCOUNT_REQUIRED'))).toBe(
      'invites.errors.accountRequired',
    );
    expect(getTripDataErrorKey(new TripDataError('OFFLINE_MUTATION_DISABLED'))).toBe(
      'status.offlineMutation',
    );
    expect(getTripDataErrorKey(new Error('boom'))).toBe('auth.genericError');
  });
});

describe('settlement share text', () => {
  const t = i18n.getFixedT('tr');
  const bundle = { trip: demoTrips[0], members: demoMembers };

  it('lists each transfer with formatted amounts', () => {
    const text = buildSettlementShareText(
      bundle,
      [{ fromMemberId: demoMembers[1].id, toMemberId: demoMembers[0].id, amountMinor: 45000 }],
      t,
    );
    expect(text).toContain(demoTrips[0].title);
    expect(text).toContain(`${demoMembers[1].displayName} → ${demoMembers[0].displayName}`);
    expect(text).toMatch(/450,00/);
  });

  it('says everyone is settled when there is nothing to pay', () => {
    expect(buildSettlementShareText(bundle, [], t)).toContain('Herkes hesaplaştı');
  });
});
