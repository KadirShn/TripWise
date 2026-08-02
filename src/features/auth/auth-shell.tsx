import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppText, BrandMark, Screen } from '@/components/ui';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function AuthShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { colors } = useAppTheme();
  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}>
      <View style={{ gap: spacing.xl }}>
        <View
          style={{
            gap: spacing.lg,
            padding: spacing.xl,
            paddingTop: spacing.xxl,
            borderRadius: radius.xl,
            backgroundColor: colors.navy,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 118,
              height: 118,
              borderRadius: 59,
              right: -28,
              top: -34,
              backgroundColor: colors.coral,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 58,
              height: 58,
              borderRadius: 29,
              right: 68,
              bottom: -22,
              backgroundColor: colors.sky,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <BrandMark size={54} />
            <AppText variant="subtitle" style={{ color: colors.onNavy }}>
              TripWise
            </AppText>
          </View>
          <View style={{ maxWidth: '86%', gap: spacing.sm }}>
            <AppText variant="display" style={{ color: colors.onNavy }}>
              {title}
            </AppText>
            <AppText style={{ color: '#DCE4F2' }}>{subtitle}</AppText>
          </View>
        </View>
        {children}
      </View>
    </Screen>
  );
}
