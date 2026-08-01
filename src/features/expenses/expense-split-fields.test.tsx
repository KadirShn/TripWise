import { fireEvent, render } from '@testing-library/react-native';
import type { TripMember } from '@/types/domain';
import { i18n } from '@/lib/i18n';
import { ExpenseSplitFields } from './expense-split-fields';

const members: TripMember[] = [
  {
    id: 'a',
    tripId: 'trip',
    userId: 'user-a',
    displayName: 'Ayşe',
    email: null,
    role: 'owner',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'b',
    tripId: 'trip',
    userId: null,
    displayName: 'Bora',
    email: null,
    role: 'editor',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const baseProps = {
  members,
  selected: ['a', 'b'],
  exactValues: { a: '50', b: '50' },
  percentValues: { a: '50', b: '50' },
  onToggle: jest.fn(),
  onExactChange: jest.fn(),
  onPercentChange: jest.fn(),
};

describe('ExpenseSplitFields', () => {
  beforeAll(async () => i18n.changeLanguage('tr'));

  it('shows no numeric allocation fields for equal split and toggles members', async () => {
    const screen = await render(<ExpenseSplitFields {...baseProps} method="equal" />);
    expect(screen.queryByLabelText('Ayşe için pay')).toBeNull();
    fireEvent.press(screen.getByRole('checkbox', { name: 'Ayşe' }));
    expect(baseProps.onToggle).toHaveBeenCalledWith('a');
  });

  it('renders exact amount inputs and reports edits', async () => {
    const onExactChange = jest.fn();
    const screen = await render(
      <ExpenseSplitFields {...baseProps} method="exact" onExactChange={onExactChange} />,
    );
    fireEvent.changeText(screen.getByLabelText('Ayşe için pay'), '60');
    expect(onExactChange).toHaveBeenCalledWith('a', '60');
  });

  it('renders percentage inputs and reports edits', async () => {
    const onPercentChange = jest.fn();
    const screen = await render(
      <ExpenseSplitFields {...baseProps} method="percentage" onPercentChange={onPercentChange} />,
    );
    fireEvent.changeText(screen.getByLabelText('Bora için yüzde'), '40');
    expect(onPercentChange).toHaveBeenCalledWith('b', '40');
  });
});
