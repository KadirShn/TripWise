import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';
import { AppText } from './app-text';
import { Button } from './button';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = 'map-marker-path',
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        paddingVertical: 56,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 86,
          height: 86,
          borderRadius: 28,
          backgroundColor: colors.skySoft,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-4deg' }],
        }}
      >
        <MaterialCommunityIcons name={icon} size={44} color={colors.primary} />
      </View>
      <AppText variant="title" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText style={{ color: colors.textMuted, textAlign: 'center' }}>{description}</AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
