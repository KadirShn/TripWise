import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
import { BrandHeader } from '@/components/ui';
export default function SettingsStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t('settings.title'),
          headerTitle: () => <BrandHeader title={t('settings.title')} />,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
