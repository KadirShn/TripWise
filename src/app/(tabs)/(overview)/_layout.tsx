import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
export default function OverviewStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t('overview.title'), headerLargeTitle: true, headerShadowVisible: false }}
      />
    </Stack>
  );
}
