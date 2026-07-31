import type { ErrorBoundaryProps } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, Screen } from '@/components/ui';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <AppText variant="title">{t('common.error')}</AppText>
      <AppText>{t('auth.genericError')}</AppText>
      <Button label={t('common.retry')} onPress={retry} />
    </Screen>
  );
}
