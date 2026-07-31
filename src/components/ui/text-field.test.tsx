import { render } from '@testing-library/react-native';
import { TextField } from './text-field';

describe('TextField', () => {
  it('exposes a field-level validation error', async () => {
    const screen = await render(<TextField label="Gezi adı" error="Bu alan zorunludur" />);
    expect(screen.getByLabelText('Gezi adı')).toBeTruthy();
    expect(screen.getByText('Bu alan zorunludur')).toBeTruthy();
  });
});
