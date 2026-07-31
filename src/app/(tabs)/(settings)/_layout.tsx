import { Stack } from 'expo-router/stack';
import { useTranslation } from 'react-i18next';
export default function SettingsStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t('settings.title'), headerLargeTitle: true, headerShadowVisible: false }}
      />
    </Stack>
  );
}
