import { View } from 'react-native';
import { radius } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function Skeleton({
  height = 18,
  width = '100%',
}: {
  height?: number;
  width?: number | `${number}%`;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        height,
        width,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.sm,
        opacity: 0.75,
      }}
    />
  );
}
