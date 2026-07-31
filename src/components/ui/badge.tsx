import { View } from 'react-native';
import { AppText } from './app-text';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function Badge({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: 'primary' | 'warning' | 'neutral';
}) {
  const { colors } = useAppTheme();
  const color =
    tone === 'warning' ? colors.warning : tone === 'neutral' ? colors.textMuted : colors.primary;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceMuted,
      }}
    >
      <AppText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </AppText>
    </View>
  );
}
