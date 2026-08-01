import { useTranslation } from 'react-i18next';
import { ErrorState, Screen, Skeleton } from '@/components/ui';

export function TripDataLoadingScreen() {
  return (
    <Screen>
      <Skeleton height={52} />
      <Skeleton height={150} />
      <Skeleton height={110} />
    </Screen>
  );
}

export function TripDataErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <ErrorState
        title={t('common.error')}
        description={t('status.dataLoadError')}
        retryLabel={t('common.retry')}
        onRetry={onRetry}
      />
    </Screen>
  );
}
