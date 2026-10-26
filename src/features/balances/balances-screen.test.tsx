import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';
import { DEMO_TRIP_ID } from '@/constants/demo-data';
import { i18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { BalancesScreen } from './balances-screen';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ tripId: '10000000-0000-4000-8000-000000000001' }),
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: null }) }));
jest.mock('expo-crypto', () => {
  let id = 0;
  return { randomUUID: () => `balance-test-${++id}` };
});

const renderScreen = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } })}
    >
      <BalancesScreen />
    </QueryClientProvider>,
  );

describe('BalancesScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    useAppStore.getState().resetDemo();
  });

  it('records a paid transfer, shrinks the plan, and can undo it', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    const pressAlertButton = async (text: string) => {
      const buttons = alert.mock.calls.at(-1)?.[2] as AlertButton[] | undefined;
      await act(async () => {
        buttons?.find((button) => button.text === text)?.onPress?.();
      });
    };
    const screen = await renderScreen();
    const before = screen.getAllByText('Ödendi').length;
    expect(before).toBeGreaterThan(0);

    await fireEvent.press(screen.getAllByText('Ödendi')[0]);
    await pressAlertButton('Ödendi');

    const settlements = useAppStore
      .getState()
      .settlements.filter((item) => item.tripId === DEMO_TRIP_ID);
    expect(settlements).toHaveLength(1);
    expect(settlements[0].status).toBe('paid');
    expect(screen.getByText('Yapılan ödemeler')).toBeTruthy();
    expect(screen.queryAllByText('Ödendi')).toHaveLength(before - 1);

    await fireEvent.press(screen.getByLabelText(/ödeme kaydını geri al/));
    await pressAlertButton('Geri al');
    expect(useAppStore.getState().settlements).toHaveLength(0);
    expect(screen.queryByText('Yapılan ödemeler')).toBeNull();
    alert.mockRestore();
    screen.unmount();
  });
});
