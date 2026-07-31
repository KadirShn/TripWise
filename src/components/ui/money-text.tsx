import type { TextProps } from 'react-native';
import { AppText } from './app-text';
import { formatMoney } from '@/utils/money/money';
export function MoneyText({
  amountMinor,
  currency,
  ...props
}: TextProps & { amountMinor: number; currency: string }) {
  return (
    <AppText style={{ fontVariant: ['tabular-nums'] }} {...props}>
      {formatMoney(amountMinor, currency)}
    </AppText>
  );
}
