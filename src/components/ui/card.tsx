import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function Card({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  const { colors, isDark } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          padding: spacing.lg + 2,
          gap: spacing.md,
          boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.20)' : '0 10px 30px rgba(68,52,35,0.08)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
