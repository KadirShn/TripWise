import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/use-app-theme';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <NativeTabs tintColor={colors.primary} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(trips)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'suitcase', selected: 'suitcase.fill' }}
          md="luggage"
        />
        <NativeTabs.Trigger.Label>{t('nav.trips')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(overview)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="monitoring"
        />
        <NativeTabs.Trigger.Label>{t('nav.overview')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>{t('nav.settings')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
