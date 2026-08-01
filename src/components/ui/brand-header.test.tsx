import { render } from '@testing-library/react-native';
import { BrandHeader } from './brand-header';

describe('BrandHeader', () => {
  it('renders the TripWise mark beside the localized title', async () => {
    const screen = await render(<BrandHeader title="Gezilerim" />);

    expect(screen.getByLabelText('TripWise')).toBeTruthy();
    expect(screen.getByText('Gezilerim')).toBeTruthy();
  });
});
