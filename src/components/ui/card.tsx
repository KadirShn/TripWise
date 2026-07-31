import type { PropsWithChildren } from 'react';
import { View, type ViewProps } from 'react-native';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function Card({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          borderCurve: 'continuous',
          padding: spacing.lg,
          gap: spacing.md,
          boxShadow: '0 4px 18px rgba(8, 40, 35, 0.06)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
