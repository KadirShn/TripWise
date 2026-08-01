import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
import { BrandHeader } from '@/components/ui';
export default function OverviewStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t('overview.title'),
          headerTitle: () => <BrandHeader title={t('overview.title')} />,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
