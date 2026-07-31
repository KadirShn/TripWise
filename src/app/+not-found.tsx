import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@/components/ui';
export default function NotFoundRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Screen>
      <EmptyState
        title={t('status.notFound')}
        description={t('auth.genericError')}
        actionLabel={t('status.goHome')}
        onAction={() => router.replace('/(tabs)/(trips)')}
      />
    </Screen>
  );
}
