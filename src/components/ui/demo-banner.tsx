import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppText } from './app-text';
import { Badge } from './badge';
import { useAppStore } from '@/stores/app-store';
import { spacing } from '@/theme/theme';
import { useAppTheme } from '@/theme/use-app-theme';
export function DemoBanner() {
  const mode = useAppStore((state) => state.mode);
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  if (mode !== 'guest') return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Badge label={t('demo.badge')} tone="warning" />
      <AppText variant="caption" style={{ color: colors.textMuted, flex: 1 }}>
        {t('demo.notice')}
      </AppText>
    </View>
  );
}
