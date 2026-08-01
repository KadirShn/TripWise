import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function LegalSection({ title, body }: { title: string; body: string }) {
  const { colors } = useAppTheme();
  return (
    <Card accessibilityRole="summary">
      <AppText variant="subtitle">{title}</AppText>
      <AppText style={{ color: colors.textMuted }}>{body}</AppText>
    </Card>
  );
}

export function LegalBulletList({ items }: { items: string[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <AppText accessibilityElementsHidden style={{ color: colors.primary }}>
            •
          </AppText>
          <AppText style={{ color: colors.textMuted, flex: 1 }}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}
