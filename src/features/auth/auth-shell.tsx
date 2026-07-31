import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppText, Screen } from '@/components/ui';
import { radius, spacing } from '@/theme/theme';
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
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: radius.lg,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="compass-outline" size={38} color={colors.onPrimary} />
          </View>
          <AppText variant="display">TripWise</AppText>
          <AppText variant="title">{title}</AppText>
          <AppText style={{ color: colors.textMuted }}>{subtitle}</AppText>
        </View>
        {children}
      </View>
    </Screen>
  );
}
