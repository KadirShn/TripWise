import type { TFunction } from 'i18next';
import type { SettlementTransfer, TripBundle } from '@/types/domain';
import { formatMoney } from '@/utils/money/money';

/** Builds the plain-text payment plan shared to messaging apps. */
export function buildSettlementShareText(
  bundle: Pick<TripBundle, 'trip' | 'members'>,
  transfers: SettlementTransfer[],
  t: TFunction,
): string {
  const name = (id: string) =>
    bundle.members.find((member) => member.id === id)?.displayName ?? '—';
  const lines = transfers.length
    ? transfers.map((transfer) =>
        t('balances.shareLine', {
          from: name(transfer.fromMemberId),
          to: name(transfer.toMemberId),
          amount: formatMoney(transfer.amountMinor, bundle.trip.baseCurrency),
        }),
      )
    : [t('balances.shareSettled')];
  return [
    t('balances.shareHeader', { trip: bundle.trip.title }),
    '',
    ...lines,
    '',
    t('balances.shareFooter'),
  ].join('\n');
}
