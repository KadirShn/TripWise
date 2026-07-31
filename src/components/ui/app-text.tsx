import type { PropsWithChildren } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/use-app-theme';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
const variants: Record<Variant, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
};

export function AppText({
  variant = 'body',
  style,
  children,
  ...props
}: PropsWithChildren<TextProps & { variant?: Variant }>) {
  const { colors } = useAppTheme();
  return (
    <Text selectable style={[{ color: colors.text }, variants[variant], style]} {...props}>
      {children}
    </Text>
  );
}
