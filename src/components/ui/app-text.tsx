import type { PropsWithChildren } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/use-app-theme';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
const variants: Record<Variant, TextStyle> = {
  display: { fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.1 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 19, lineHeight: 25, fontWeight: '800', letterSpacing: -0.15 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
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
