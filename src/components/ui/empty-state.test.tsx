import { fireEvent, render } from '@testing-library/react-native';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders its message and invokes the recovery action', async () => {
    const onAction = jest.fn();
    const screen = await render(
      <EmptyState
        title="Boş liste"
        description="Henüz kayıt yok"
        actionLabel="Ekle"
        onAction={onAction}
      />,
    );
    expect(screen.getByText('Boş liste')).toBeTruthy();
    expect(screen.getByText('Henüz kayıt yok')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Ekle' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
