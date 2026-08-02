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
  const backgroundColor =
    tone === 'warning' ? colors.sunSoft : tone === 'neutral' ? colors.surfaceMuted : colors.skySoft;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        backgroundColor,
      }}
    >
      <AppText variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </AppText>
    </View>
  );
}
