import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { radius, spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';

/** Explains why edit controls are hidden for trip viewers. */
export function ViewerNotice({ message }: { message?: string }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceMuted,
      }}
    >
      <MaterialCommunityIcons name="eye-outline" size={22} color={colors.textMuted} />
      <AppText style={{ flex: 1, color: colors.textMuted }}>
        {message ?? t('permissions.viewerNotice')}
      </AppText>
    </View>
  );
}
