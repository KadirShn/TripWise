import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppText, BrandMark, Screen } from '@/components/ui';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function AuthShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { colors } = useAppTheme();
  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 56 }}>
      <View style={{ gap: spacing.xl }}>
        <View style={{ gap: spacing.md, alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <BrandMark size={64} />
            <AppText variant="display">TripWise</AppText>
          </View>
          <AppText variant="title">{title}</AppText>
          <AppText style={{ color: colors.textMuted }}>{subtitle}</AppText>
        </View>
        {children}
      </View>
    </Screen>
  );
}
