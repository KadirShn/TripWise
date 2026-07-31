import { EmptyState } from './empty-state';
export function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
}: {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title={title}
      description={description}
      actionLabel={retryLabel}
      onAction={onRetry}
    />
  );
}
