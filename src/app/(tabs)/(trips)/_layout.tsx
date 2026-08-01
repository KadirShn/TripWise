import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
import { BrandHeader } from '@/components/ui';
export default function TripsStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t('trips.title'),
          headerTitle: () => <BrandHeader title={t('trips.title')} />,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
