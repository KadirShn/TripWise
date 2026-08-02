import { View } from 'react-native';
import { radius } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function ProgressBar({
  value,
  accessibilityLabel,
}: {
  value: number;
  accessibilityLabel: string;
}) {
  const { colors } = useAppTheme();
  const percent = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent * 100) }}
      style={{
        height: 12,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${percent * 100}%`,
          backgroundColor: value > 1 ? colors.danger : colors.coral,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}
