import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppText } from './app-text';
import { Badge } from './badge';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

export function TravelHero({
  eyebrow,
  title,
  description,
  children,
}: PropsWithChildren<{ eyebrow?: string; title: string; description?: string }>) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        minHeight: 218,
        padding: spacing.xl,
        paddingTop: spacing.xxl,
        borderRadius: radius.xl,
        borderCurve: 'continuous',
        backgroundColor: colors.navy,
        overflow: 'hidden',
        gap: spacing.md,
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 116,
          height: 116,
          borderRadius: 58,
          right: -24,
          top: -28,
          backgroundColor: colors.coral,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 68,
          height: 68,
          borderRadius: 34,
          right: 74,
          bottom: -28,
          backgroundColor: colors.sky,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 26,
          top: 30,
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: colors.sun,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '9deg' }],
        }}
      >
        <MaterialCommunityIcons name="map-marker-path" size={27} color={colors.navy} />
      </View>
      <View style={{ maxWidth: '78%', gap: spacing.md }}>
        {eyebrow ? <Badge label={eyebrow} tone="warning" /> : null}
        <AppText variant="display" style={{ color: colors.onNavy }}>
          {title}
        </AppText>
        {description ? <AppText style={{ color: '#DCE4F2' }}>{description}</AppText> : null}
      </View>
      {children ? <View style={{ paddingTop: spacing.sm }}>{children}</View> : null}
    </View>
  );
}

export function SectionHeading({ title, caption }: { title: string; caption?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="title">{title}</AppText>
      {caption ? <AppText style={{ color: colors.textMuted }}>{caption}</AppText> : null}
    </View>
  );
}
