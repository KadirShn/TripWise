import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from './app-text';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function OfflineBanner() {
  const online = useNetworkStatus();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  if (online) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: colors.warning, padding: spacing.sm, borderRadius: 10 }}
    >
      <AppText variant="caption" style={{ color: '#1C1200' }}>
        {t('status.offline')}
      </AppText>
    </View>
  );
}
